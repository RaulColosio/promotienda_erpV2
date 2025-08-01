import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCrm } from '../store/crmStore';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, LayersIcon, UsersIcon, PlusIcon } from './Icons';
import { Deal, Contact } from '../types';
import AddDealModal from './AddDealModal';
import AddEditContactModal from './AddEditContactModal';

const GlobalSearch: React.FC = () => {
    const { deals, contacts, showContactDetail } = useCrm();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    const searchResults = useMemo(() => {
        if (query.length < 2) return { deals: [], contacts: [] };

        const lowerCaseQuery = query.toLowerCase();

        // 1. Find matching contacts
        const matchingContacts = contacts.filter(contact =>
            `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(lowerCaseQuery) ||
            (contact.email && contact.email.toLowerCase().includes(lowerCaseQuery)) ||
            (contact.phone && contact.phone.includes(lowerCaseQuery))
        );
        
        // 2. Get IDs of matching contacts to find their deals
        const matchingContactIds = new Set(matchingContacts.map(c => c.id));

        // 3. Find deals that match by title OR are associated with a matching contact
        const matchingDeals = deals.filter(deal =>
            deal.title.toLowerCase().includes(lowerCaseQuery) ||
            deal.contactIds.some(contactId => matchingContactIds.has(contactId))
        );
        
        // 4. Ensure deals are unique (a deal could match by title AND contact)
        const uniqueDeals = Array.from(new Map(matchingDeals.map(deal => [deal.id, deal])).values());

        return {
            deals: uniqueDeals.slice(0, 5),
            contacts: matchingContacts.slice(0, 5)
        };
    }, [query, deals, contacts]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDealClick = (dealId: string) => {
        navigate(`/deals/${dealId}`);
        setQuery('');
        setIsFocused(false);
    };

    const handleContactClick = (contactId: string) => {
        showContactDetail(contactId);
        setQuery('');
        setIsFocused(false);
    }

    const handleCreateDealClick = () => {
        setIsAddDealModalOpen(true);
        setIsFocused(false);
    };

    const handleCreateContactClick = () => {
        setIsAddContactModalOpen(true);
        setIsFocused(false);
    };
    
    const showResults = isFocused && query.length >= 2;

    const hasResults = searchResults.deals.length > 0 || searchResults.contacts.length > 0;

    return (
        <div className="relative w-full max-w-lg" ref={searchRef}>
            <div className="relative">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search deals or contacts..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="block w-full rounded-md border-slate-300 bg-slate-100 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            {showResults && (
                <div className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {hasResults ? (
                            <>
                                {searchResults.deals.length > 0 && (
                                    <div>
                                        <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Deals</h3>
                                        {searchResults.deals.map((deal: Deal) => (
                                            <button key={deal.id} onClick={() => handleDealClick(deal.id)} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                                <LayersIcon className="w-4 h-4 mr-3 text-slate-400"/>
                                                {deal.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searchResults.contacts.length > 0 && (
                                     <div>
                                        <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Contacts</h3>
                                        {searchResults.contacts.map((contact: Contact) => (
                                            <button key={contact.id} onClick={() => handleContactClick(contact.id)} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                                 <UsersIcon className="w-4 h-4 mr-3 text-slate-400"/>
                                                {contact.firstName} {contact.lastName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="px-4 py-3 text-sm text-center text-slate-500">
                                <p>No results found for "{query}".</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        onClick={handleCreateDealClick}
                                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Create Deal
                                    </button>
                                    <button
                                        onClick={handleCreateContactClick}
                                        className="flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Create Contact
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AddDealModal 
                isOpen={isAddDealModalOpen} 
                onClose={() => setIsAddDealModalOpen(false)}
                initialTitle={query}
            />
            <AddEditContactModal 
                isOpen={isAddContactModalOpen} 
                onClose={() => setIsAddContactModalOpen(false)} 
                contactToEdit={null}
                onContactAdded={(newContact) => {
                    // After creating a contact from search, we might want to create a deal with them
                    // For now, just close the modal. A more advanced flow could open the deal modal.
                }}
            />
        </div>
    );
};

export default GlobalSearch;