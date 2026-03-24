import { useState, useEffect, useRef } from 'react';
import { userAPI } from '../api';

export default function UserSelect({ value, onChange }) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await userAPI.getAll(search);
                setUsers(res.data);
            } catch (err) {}
            finally { setLoading(false); }
        };
        
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const displayValue = value && !isOpen ? (users.find(u => u.id === value) ? `${users.find(u => u.id === value).username}` : `User #${value}`) : search;

    return (
        <div className="user-select-container" ref={wrapperRef}>
            <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={displayValue || ''}
                onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
                onFocus={() => { setIsOpen(true); setSearch(''); }}
                className="user-select-input"
            />
            {isOpen && (
                <div className="user-select-dropdown">
                    <div className="user-select-option" onClick={() => { onChange(''); setIsOpen(false); }}>
                        <em>Unassigned</em>
                    </div>
                    {loading ? (
                        <div className="user-select-loading">Loading...</div>
                    ) : users.map(u => (
                        <div 
                            key={u.id} 
                            className="user-select-option"
                            onClick={() => { onChange(u.id); setSearch(''); setIsOpen(false); }}
                        >
                            <span className="user-select-uname">{u.username}</span>
                            <span className="user-select-uemail">{u.email}</span>
                        </div>
                    ))}
                    {!loading && users.length === 0 && (
                        <div className="user-select-loading">No users found</div>
                    )}
                </div>
            )}
        </div>
    );
}
