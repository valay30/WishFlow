import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ORANGE = 'var(--primary)';
const BORDER = 'var(--border)';
const SURFACE2 = 'var(--surface-2)';

export default function AddExistingItemsModal({ allItems, activeCollectionId, onAddItems, onClose }) {
    const [search, setSearch] = useState('');
    const { currency } = useSettings();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [saving, setSaving] = useState(false);

    // Filter by search query
    const filteredItems = allItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleItem = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSave = async () => {
        if (selectedIds.size === 0) return;
        setSaving(true);
        try {
            await onAddItems(Array.from(selectedIds));
            onClose();
        } catch (error) {
            console.error(error);
            alert(`Failed to add items: ${error.message || "Unknown error"}. Did you run the Supabase SQL for collection_items?`);
            setSaving(false);
        }
    };

    return createPortal(
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999 }} />
            <div style={{ position: 'fixed', top: 0, bottom: 0, right: 0, zIndex: 10000, display: 'flex' }}>
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'var(--surface)',
                        width: '380px', maxWidth: '85vw', height: '100vh',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
                        animation: 'slideLeft 0.28s cubic-bezier(0.2,0.8,0.4,1)',
                        borderLeft: `1px solid ${BORDER}`,
                    }}
                >
                    {/* Header */}
                    <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: ORANGE, margin: 0 }}>
                                Add Items to Collection
                            </h2>
                            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                                Tap items to select them
                            </p>
                        </div>
                        <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '0 1.5rem 1rem', flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} color="#888" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                placeholder="Search items..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.85rem 1rem 0.85rem 2.6rem',
                                    background: SURFACE2, border: `1px solid ${BORDER}`,
                                    borderRadius: '14px', fontFamily: 'inherit',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 1rem' }}>
                        {filteredItems.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                                <p>No items found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                {filteredItems.map(item => {
                                    const selected = selectedIds.has(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('application/json', JSON.stringify(item));
                                                e.dataTransfer.effectAllowed = 'copy';
                                            }}
                                            onClick={() => toggleItem(item.id)}
                                            style={{
                                                position: 'relative', cursor: 'pointer',
                                                borderRadius: '16px', overflow: 'hidden',
                                                border: `2px solid ${selected ? ORANGE : 'transparent'}`,
                                                background: SURFACE2, padding: '0.5rem',
                                                transition: 'all 0.15s',
                                                boxShadow: selected ? '0 4px 12px rgba(var(--primary-rgb),0.15)' : 'none'
                                            }}
                                        >
                                            {selected && (
                                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: ORANGE, color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                                    <Check size={14} />
                                                </div>
                                            )}
                                            <div style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#ddd', marginBottom: '0.5rem' }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '2rem' }}>?</div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: ORANGE, fontWeight: 700 }}>
                                                {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(item.price)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '1rem 1.5rem 2rem', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                        <button
                            onClick={handleSave}
                            disabled={selectedIds.size === 0 || saving}
                            style={{
                                width: '100%', padding: '1rem',
                                background: saving || selectedIds.size === 0 ? 'rgba(var(--primary-rgb),0.5)' : ORANGE,
                                color: '#fff', border: 'none', borderRadius: '14px',
                                fontWeight: 800, fontSize: '1rem', cursor: saving || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: selectedIds.size === 0 ? 0.7 : 1,
                                transition: 'all 0.2s',
                            }}
                        >
                            <Sparkles size={18} />
                            {selectedIds.size > 0 ? `Add ${selectedIds.size} Item${selectedIds.size > 1 ? 's' : ''}` : 'Select Items to Add'}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>,
        document.body
    );
}
