import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FolderHeart, Tag, ShoppingBag, X, ChevronRight } from 'lucide-react';
import { db } from '../db';
import { useSettings } from '../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    // Data stores
    const [items, setItems] = useState([]);
    const [collections, setCollections] = useState([]);
    const [categories, setCategories] = useState([]);

    const { darkMode } = useSettings();
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const resultsRef = useRef(null);

    // Toggle shortcut (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Fetch data when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedIndex(0);
            
            const fetchData = async () => {
                const [fetchedItems, fetchedCols, fetchedCats] = await Promise.all([
                    db.items.getAll().catch(() => []),
                    db.collections.getAll().catch(() => []),
                    db.categories.getAll().catch(() => [])
                ]);
                setItems(fetchedItems || []);
                setCollections(fetchedCols || []);
                setCategories(fetchedCats || []);
            };
            fetchData();
            
            // Auto-focus input without scrolling the page
            setTimeout(() => {
                inputRef.current?.focus({ preventScroll: true });
            }, 100);
        }
        
        return () => {};
    }, [isOpen]);

    // Filter results
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        
        const filteredCollections = collections
            .filter(c => c.name.toLowerCase().includes(query))
            .map(c => ({ ...c, _type: 'collection', _icon: c.emoji || <FolderHeart size={16} /> }));
            
        const filteredCategories = categories
            .filter(c => c.name.toLowerCase().includes(query))
            .map(c => ({ ...c, _type: 'category', _icon: <Tag size={16} /> }));
            
        const filteredItems = items
            .filter(i => i.name.toLowerCase().includes(query))
            .map(i => ({ ...i, _type: 'item', _icon: <ShoppingBag size={16} /> }));

        setResults([...filteredCollections, ...filteredCategories, ...filteredItems]);
        setSelectedIndex(0);
    }, [searchQuery, items, collections, categories]);

    // Scroll active item into view
    useEffect(() => {
        if (resultsRef.current && results.length > 0) {
            const activeElement = resultsRef.current.children[selectedIndex];
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, results]);

    // Handle Keyboard Navigation within the modal
    const handleModalKeyDown = (e) => {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        }
    };

    const handleSelect = (item) => {
        setIsOpen(false);
        if (item._type === 'item') {
            navigate(`/product/${item.id}`);
        } else if (item._type === 'collection') {
            sessionStorage.setItem('activeCollectionId', item.id);
            navigate('/collections');
        } else if (item._type === 'category') {
            navigate(`/home?category=${item.id}`);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div 
                onClick={() => setIsOpen(false)}
                style={{
                    position: 'fixed', inset: 0, zIndex: 999999,
                    background: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '10vh'
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: darkMode ? 'rgba(30, 30, 32, 0.65)' : 'rgba(255, 255, 255, 0.65)',
                        backdropFilter: 'blur(40px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                        width: '90%', maxWidth: '640px',
                        borderRadius: '16px',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column'
                    }}
                >
                    {/* Search Input */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
                        <Search size={24} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search for apps, items, or collections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleModalKeyDown}
                            style={{
                                flex: 1, background: 'transparent', border: 'none',
                                padding: '0 16px', fontSize: '1.4rem', color: 'var(--text)',
                                fontWeight: 400, outline: 'none', width: '100%',
                                caretColor: '#007AFF'
                            }}
                        />
                        <div 
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                                padding: '4px 8px', borderRadius: '6px',
                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            ESC
                        </div>
                    </div>

                    {/* Results Area */}
                    <div 
                        ref={resultsRef}
                        style={{ 
                            maxHeight: '400px', overflowY: 'auto', padding: '12px',
                            display: 'flex', flexDirection: 'column', gap: '4px'
                        }}
                    >
                        {searchQuery.trim() === '' ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Start typing to search across your wishlist...
                            </div>
                        ) : results.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No results found for "{searchQuery}"
                            </div>
                        ) : (
                            results.map((result, idx) => {
                                const isSelected = idx === selectedIndex;
                                return (
                                    <div
                                        key={`${result._type}-${result.id}`}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        onClick={() => handleSelect(result)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '12px 16px', borderRadius: '8px',
                                            background: isSelected ? '#007AFF' : 'transparent',
                                            color: isSelected ? '#FFF' : 'var(--text)',
                                            cursor: 'pointer',
                                            transition: 'background 0s'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: isSelected ? 'rgba(255,255,255,0.2)' : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                            color: isSelected ? '#FFF' : 'var(--text)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1rem', flexShrink: 0
                                        }}>
                                            {result._icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 500, fontSize: '1rem', color: isSelected ? '#FFF' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {result.name}
                                            </p>
                                            <p style={{ margin: '2px 0 0 0', fontWeight: 400, fontSize: '0.8rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                                                {result._type.charAt(0).toUpperCase() + result._type.slice(1)}
                                            </p>
                                        </div>
                                        {isSelected && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>↵ to open</span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
