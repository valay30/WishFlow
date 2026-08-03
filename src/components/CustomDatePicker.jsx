import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { createPortal } from 'react-dom';

const ORANGE = 'var(--primary)';
const BORDER = 'var(--border)';
const SURFACE2 = 'var(--surface-2)';

const INPUT_ST = {
    width: '100%', padding: '0.85rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '14px', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer'
};

const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function CustomDatePicker({ value, onChange, placeholder = "Select date..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(() => {
        return value ? new Date(value) : new Date();
    });
    
    const containerRef = useRef(null);
    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current && 
                !containerRef.current.contains(event.target) &&
                popupRef.current &&
                !popupRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Calendar logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => {
        const day = new Date(y, m, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust so Monday is 0, Sunday is 6
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const prevMonthDays = getDaysInMonth(year, month - 1);
    
    const weeks = [];
    let currentWeek = [];
    
    // Previous month days
    for (let i = 0; i < firstDay; i++) {
        currentWeek.unshift({
            day: prevMonthDays - i,
            isCurrentMonth: false,
            date: new Date(year, month - 1, prevMonthDays - i)
        });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        currentWeek.push({
            day: i,
            isCurrentMonth: true,
            date: new Date(year, month, i)
        });
        
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    
    // Next month days
    if (currentWeek.length > 0) {
        let nextDay = 1;
        while (currentWeek.length < 7) {
            currentWeek.push({
                day: nextDay++,
                isCurrentMonth: false,
                date: new Date(year, month + 1, nextDay - 1)
            });
        }
        weeks.push(currentWeek);
    }

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleSelectDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    const formattedValue = value ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }) : '';

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;

    const popupContent = isOpen && (
        <div
            ref={popupRef}
            style={{
                position: 'fixed',
                ...(isMobile ? {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'calc(100vw - 32px)',
                    maxWidth: '320px',
                } : {
                    top: containerRef.current ? containerRef.current.getBoundingClientRect().top + window.scrollY - 8 : 0,
                    transform: 'translateY(-100%)',
                    left: containerRef.current ? containerRef.current.getBoundingClientRect().left + window.scrollX : 0,
                    width: '280px',
                }),
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '1.25rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                border: `1px solid ${BORDER}`,
                zIndex: 100001,
                fontFamily: 'inherit'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <button onClick={handlePrevMonth} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#333' }}>
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111' }}>
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#333' }}>
                    <ChevronRight size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Days of Week */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '0.5rem', textAlign: 'center' }}>
                {daysOfWeek.map(day => (
                    <div key={day} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666', paddingBottom: '0.5rem' }}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: '0', 
                        background: wIndex % 2 === 0 ? 'transparent' : '#F3F4F6',
                        borderRadius: '99px',
                        padding: '2px 0'
                    }}>
                        {week.map((dayObj, dIndex) => {
                            const isSelected = value && new Date(value).toDateString() === dayObj.date.toDateString();
                            return (
                                <div key={dIndex} style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectDate(dayObj.date)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: isSelected ? '#111' : 'transparent',
                                            color: isSelected ? '#FFF' : (dayObj.isCurrentMonth ? '#111' : '#A0AEC0'),
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {dayObj.day}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div 
                ref={containerRef}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    ...INPUT_ST,
                    borderColor: isOpen ? ORANGE : BORDER,
                    boxShadow: isOpen ? `0 0 0 4px rgba(var(--primary-rgb),0.1)` : 'none'
                }}
            >
                <span style={{ color: value ? 'var(--text)' : 'var(--text-muted)' }}>
                    {formattedValue || placeholder}
                </span>
                <CalendarIcon size={18} color="var(--text-muted)" />
            </div>
            {createPortal(popupContent, document.body)}
        </>
    );
}
