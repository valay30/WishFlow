import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Trash2, Edit2, Plus, X, Check, ArrowLeft, Tag, Layers, GripVertical, LayoutGrid, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import { useIsland } from '../context/IslandContext';
import { Reorder, motion, useAnimation, useDragControls } from 'framer-motion';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const SURFACE2 = 'var(--surface-2)';
const BORDER = 'var(--border)';
const BG = 'var(--bg)';

const CategoryItem = ({ cat, editingId, setEditingId, editingName, setEditingName, saveEdit, startEdit, handleDelete, handleSwipeDelete, navigate, viewMode }) => {
    const isGrid = viewMode === 'grid';
    const controls = useAnimation();
    const isDragging = useRef(false);
    const dragControls = useDragControls();

    const handleEditClick = () => {
        startEdit(cat);
        controls.start({ x: 0 });
    };

    const handleDeleteClick = () => {
        handleDelete(cat.id);
        controls.start({ x: 0 });
    };

    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            // Swiped right
            handleSwipeDelete(cat);
            controls.start({ x: 0 });
        } else if (info.offset.x < -threshold) {
            // Swiped left
            handleEditClick();
        }
    };

    return (
        <Reorder.Item
            dragListener={false}
            dragControls={dragControls}
            key={cat.id}
            value={cat}
            style={{
                position: 'relative',
                background: 'var(--surface-2)',
                borderRadius: '24px',
                border: `1px solid ${BORDER}`,
                overflow: 'hidden',
                cursor: 'grab',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            whileDrag={{
                scale: 1.05,
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                cursor: 'grabbing',
                zIndex: 10
            }}
            layout
        >
            {/* Actions Background for Swipe */}
            <div style={{
                position: 'absolute',
                top: 0, bottom: 0, left: 0, right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                borderRadius: 'inherit',
                zIndex: 1,
            }}>
                <div style={{ background: '#EF4444', width: '50%', display: 'flex', alignItems: 'center', paddingLeft: '1.5rem', color: '#fff' }}>
                    <Trash2 size={24} />
                </div>
                <div style={{ background: '#9CA3AF', width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '1.5rem', color: '#fff' }}>
                    <Edit2 size={24} />
                </div>
            </div>

            {/* Swipeable Foreground */}
            <motion.div
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                animate={controls}
                onDragStart={() => { isDragging.current = true; }}
                onDragEnd={(event, info) => {
                    setTimeout(() => { isDragging.current = false; }, 100);
                    handleDragEnd(event, info);
                }}
                style={{
                    position: 'relative',
                    background: SURFACE,
                    display: 'flex',
                    flexDirection: isGrid ? 'column' : 'row',
                    justifyContent: isGrid ? 'center' : 'space-between',
                    alignItems: isGrid ? 'flex-start' : 'center',
                    padding: isGrid ? '1.25rem' : '1rem',
                    width: '100%',
                    height: isGrid ? '140px' : 'auto',
                    boxSizing: 'border-box',
                    borderRadius: 'inherit',
                    zIndex: 2,
                    gap: isGrid ? '0.75rem' : 0,
                }}
            >
                {!isGrid && (
                    <div 
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            dragControls.start(e);
                        }}
                        style={{ touchAction: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-dim)', paddingRight: '0.5rem' }}
                    >
                        <GripVertical size={18} />
                    </div>
                )}
                {editingId === cat.id ? (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isGrid ? 'column' : 'row', 
                        gap: '0.5rem', 
                        flex: 1, 
                        width: '100%', 
                        alignItems: isGrid ? 'stretch' : 'center', 
                        cursor: 'default' 
                    }} onPointerDown={e => e.stopPropagation()}>
                        <input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            autoFocus
                            style={{
                                padding: isGrid ? '0.6rem 0.8rem' : '0.8rem 1rem', 
                                background: SURFACE2, border: `2px solid ${ORANGE}`,
                                borderRadius: '16px', color: 'var(--text)', 
                                flex: isGrid ? 'none' : 1,
                                width: '100%',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
                                fontWeight: 600
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: isGrid ? 'center' : 'flex-end', marginTop: isGrid ? 'auto' : 0 }}>
                            <button onClick={saveEdit} style={{
                                background: ORANGE, color: '#fff', border: 'none', borderRadius: '14px',
                                width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(var(--primary-rgb),0.2)'
                            }}>
                                <Check size={20} strokeWidth={3} />
                            </button>
                            <button onClick={() => setEditingId(null)} style={{
                                background: 'var(--surface)', color: 'var(--text-dim)', border: `1px solid ${BORDER}`, borderRadius: '14px',
                                width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            style={{ display: 'flex', flexDirection: isGrid ? 'column' : 'row', alignItems: isGrid ? 'flex-start' : 'center', gap: isGrid ? '0.5rem' : '1rem', flex: 1, minWidth: 0, cursor: 'pointer', width: '100%' }}
                            onClick={(e) => {
                                if (isDragging.current) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                                navigate(`/?category=${cat.id}`);
                            }}
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <div style={{
                                width: isGrid ? '36px' : '44px', height: isGrid ? '36px' : '44px', borderRadius: '14px',
                                background: 'var(--primary-lt)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: ORANGE
                            }}>
                                <Tag size={isGrid ? 16 : 20} />
                            </div>
                            <div style={{ minWidth: 0, width: '100%' }}>
                                <h3 style={{
                                    fontWeight: 800, fontSize: isGrid ? '0.95rem' : '1rem', color: 'var(--text)', margin: 0,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                    {cat.name}
                                </h3>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: isGrid ? 0 : '1rem', marginTop: isGrid ? 'auto' : 0, width: isGrid ? '100%' : 'auto', justifyContent: isGrid ? 'flex-end' : 'flex-start' }} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                            <button
                                onClick={handleEditClick}
                                style={{
                                    background: 'var(--surface-2)', color: 'var(--text-dim)', border: 'none',
                                    borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = '#555'; }}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                style={{
                                    background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none',
                                    borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </Reorder.Item>
    );
};

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [newCatName, setNewCatName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const pendingDeleteRef = useRef(null);
    const deleteTimeoutRef = useRef(null);
    const navigate = useNavigate();

    const { showIsland } = useIsland();

    const [seedError, setSeedError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');

    const loadCategories = async () => {
        try {
            let cats = await db.categories.getAll();
            setDebugInfo(`getAll() returned: ${JSON.stringify(cats)}`);
            // If there's an optimistic delete pending, filter it out
            if (pendingDeleteRef.current) {
                cats = cats.filter(c => c.id !== pendingDeleteRef.current.id);
            }
            setCategories(cats || []);
        } catch (err) {
            console.error(err);
            setDebugInfo(`ERROR: ${err.message}`);
            setSeedError(err.message);
        }
    };
    useEffect(() => { 
        const interruptedDelete = localStorage.getItem('wishflow_pending_cat_delete');
        if (interruptedDelete) {
            localStorage.removeItem('wishflow_pending_cat_delete');
            db.categories.delete(interruptedDelete).then(() => {
                loadCategories();
            }).catch((err) => {
                console.error(err);
                loadCategories();
            });
        } else {
            loadCategories(); 
        }
        
        const handleBeforeUnload = () => {
            if (pendingDeleteRef.current) {
                localStorage.setItem('wishflow_pending_cat_delete', pendingDeleteRef.current.id);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Cleanup: if unmounting while a delete is pending, commit it immediately
            if (pendingDeleteRef.current) {
                const id = pendingDeleteRef.current.id;
                db.categories.delete(id).catch(console.error);
                localStorage.removeItem('wishflow_pending_cat_delete');
            }
            if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        };
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await db.categories.add(newCatName.trim());
            await loadCategories();
            setNewCatName('');
            showIsland({ title: 'Category Added', type: 'success' });
        } catch (err) {
            showIsland({ title: 'Error', subtitle: err.message, type: 'error' });
        }
    };

    const handleReorder = async (newOrder) => {
        setCategories(newOrder); // Optimistic UI
        const orderedIds = newOrder.map(c => c.id);
        try {
            await db.categoryOrder.save(orderedIds);
            if (db.categories.updateCacheOrder) {
                db.categories.updateCacheOrder(orderedIds);
            }
        } catch (err) {
            console.error("Failed to save category order", err);
            showIsland({ title: 'Order save failed', type: 'error' });
        }
    };

    const handleDelete = (id) => {
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (deleteTargetId) {
            await db.categories.delete(deleteTargetId);
            await loadCategories();
            setDeleteTargetId(null);
            showIsland({ title: 'Category Deleted', type: 'success' });
        }
    };

    const finalizeSwipeDelete = async () => {
        if (pendingDeleteRef.current) {
            const id = pendingDeleteRef.current.id;
            pendingDeleteRef.current = null;
            localStorage.removeItem('wishflow_pending_cat_delete');
            try {
                await db.categories.delete(id);
            } catch (err) {
                console.error(err);
                showIsland({ title: 'Delete failed', type: 'error' });
            }
            loadCategories();
        }
    };

    const handleSwipeDelete = (cat) => {
        if (pendingDeleteRef.current) {
            finalizeSwipeDelete();
        }
        pendingDeleteRef.current = cat;
        localStorage.setItem('wishflow_pending_cat_delete', cat.id);

        showIsland({
            title: 'Category Deleted',
            type: 'success',
            action: {
                label: 'Undo',
                onClick: handleUndo
            }
        });

        // Optimistic UI update
        setCategories(prev => prev.filter(c => c.id !== cat.id));

        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = setTimeout(() => {
            finalizeSwipeDelete();
        }, 5000);
    };

    const handleUndo = () => {
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        pendingDeleteRef.current = null;
        localStorage.removeItem('wishflow_pending_cat_delete');
        loadCategories();
    };

    const startEdit = (cat) => { setEditingId(cat.id); setEditingName(cat.name); };

    const saveEdit = async () => {
        if (editingName.trim()) {
            await db.categories.update(editingId, editingName.trim());
            await loadCategories();
            showIsland({ title: 'Category Updated', type: 'success' });
        }
        setEditingId(null);
    };

    return (
        <div style={{ minHeight: '100%', background: BG }}>
            {/* ── Hero Section ── */}
            <div style={{
                background: `linear-gradient(160deg, color-mix(in srgb, var(--primary) 40%, #000) 0%, color-mix(in srgb, var(--primary) 70%, #000) 55%, var(--primary) 100%)`,
                padding: '2.5rem 1.5rem 4rem',
                position: 'relative',
                color: '#fff'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.85rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        padding: '0.5rem 1rem', borderRadius: '99px',
                        marginBottom: '1.5rem', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: 'rgba(255,255,255,0.15)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}>
                        <Layers size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>Category List</h1>
                        <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
                            {categories.length} categories to manage items ✨
                        </p>
                    </div>
                </div>

                <div style={{ position: 'absolute', top: '2.5rem', right: '1.5rem', display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.25rem' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            background: viewMode === 'list' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            color: viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.5)',
                            border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                        }}
                    >
                        <LayoutList size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            background: viewMode === 'grid' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            color: viewMode === 'grid' ? '#fff' : 'rgba(255,255,255,0.5)',
                            border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                        }}
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* ── Content Sheet ── */}
            <div style={{
                background: BG,
                borderRadius: '32px 32px 0 0',
                marginTop: '-2rem',
                padding: '2rem 1.5rem',
                position: 'relative',
                zIndex: 2,
                minHeight: '60vh'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                    {/* ── Add Category Inline Form ── */}
                    <form
                        onSubmit={handleAdd}
                        style={{
                            display: 'flex', gap: '0.75rem', marginBottom: '2rem',
                            background: SURFACE, borderRadius: '24px',
                            border: `1px solid ${RENDER_BORDER_STYLE ? ORANGE : BORDER}`,
                            padding: '0.6rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Tag size={18} style={{ position: 'absolute', left: '1.1rem', color: ORANGE }} />
                            <input
                                placeholder="Add new list name..."
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.9rem 1rem 0.9rem 3.1rem',
                                    background: 'transparent', border: 'none', color: 'var(--text)',
                                    fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
                                    boxSizing: 'border-box', fontWeight: 600
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newCatName.trim()}
                            style={{
                                padding: '0 1.4rem',
                                background: newCatName.trim() ? ORANGE : 'var(--surface-2)',
                                color: newCatName.trim() ? '#fff' : '#9CA3AF',
                                border: 'none', borderRadius: '18px', fontWeight: 800,
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: newCatName.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '0.9rem', transition: 'all 0.2s',
                                boxShadow: newCatName.trim() ? '0 4px 12px rgba(var(--primary-rgb),0.25)' : 'none',
                            }}
                        >
                            <Plus size={18} strokeWidth={3} /> Add
                        </button>
                    </form>

                    {/* ── Categories List ── */}
                    <Reorder.Group
                        axis="y"
                        values={categories}
                        onReorder={handleReorder}
                        style={{ 
                            display: viewMode === 'grid' ? 'grid' : 'flex', 
                            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(140px, 1fr))' : undefined,
                            flexDirection: viewMode === 'grid' ? undefined : 'column', 
                            gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 
                        }}
                    >
                        {categories.map((cat) => (
                            <CategoryItem
                                key={cat.id}
                                cat={cat}
                                editingId={editingId}
                                setEditingId={setEditingId}
                                editingName={editingName}
                                setEditingName={setEditingName}
                                saveEdit={saveEdit}
                                startEdit={startEdit}
                                handleDelete={handleDelete}
                                handleSwipeDelete={handleSwipeDelete}
                                navigate={navigate}
                                viewMode={viewMode}
                            />
                        ))}
                    </Reorder.Group>

                    {categories.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '1rem', opacity: 0.6
                        }}>
                            <Layers size={48} color="#999" strokeWidth={1} />
                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No categories yet. Create one above!</p>
                            {seedError && (
                                <p style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ef4444', opacity: 1, maxWidth: '320px', lineHeight: 1.5 }}>
                                    ⚠️ {seedError}
                                </p>
                            )}
                            {debugInfo && (
                                <pre style={{
                                    fontSize: '0.7rem', color: '#555', background: '#f0f0f0',
                                    padding: '0.75rem', borderRadius: '8px', textAlign: 'left',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxWidth: '100%', opacity: 1
                                }}>
                                    {debugInfo}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <AlertModal
                isOpen={deleteTargetId !== null}
                title="WishFlow"
                message="Delete this category?"
                cancelText="Cancel"
                confirmText="OK"
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}

const RENDER_BORDER_STYLE = false; // Internal flag for conditional styling
