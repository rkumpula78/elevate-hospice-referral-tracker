
import React, { useState, useRef, useEffect } from 'react';
import { Search, MessageCircle, User, Building2, FileText, ExternalLink, Plus, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AddReferralDialog from '@/components/crm/AddReferralDialog';
import AddOrganizationDialog from '@/components/crm/AddOrganizationDialog';
import ScheduleVisitDialog from '@/components/crm/ScheduleVisitDialog';
import QuickAddDialog from '@/components/crm/QuickAddDialog';
import { AdvancedSearchModal, SearchCriteria } from './AdvancedSearchModal';
import { SearchHistoryDropdown } from './SearchHistoryDropdown';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  type: string;
  results?: {
    referrals: any[];
    patients: any[];
    organizations: any[];
  };
  response?: string;
  suggestedAction?: {
    type: 'navigate' | 'create';
    path?: string;
    item?: string;
    label: string;
  };
}

const GlobalSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isAiQuery, setIsAiQuery] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showAddOrganization, setShowAddOrganization] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: string }>>([]);
  const [advancedCriteria, setAdvancedCriteria] = useState<SearchCriteria | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Detect if this looks like an AI query
  const detectAiQuery = (query: string) => {
    const aiPatterns = [
      /^(show me|find|what|how many|list|display)/i,
      /\b(all|pending|admitted|scheduled|from|last|this)\b/i,
      /add.*referral|create.*referral|new.*referral/i,
      /schedule.*visit|create.*visit|new.*visit/i,
      /add.*organization|create.*organization|new.*organization/i,
      /quick.*add|add.*new/i
    ];
    return aiPatterns.some(pattern => pattern.test(query));
  };

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);
  
  // Save search to history
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [
      { query, timestamp: new Date().toISOString() },
      ...searchHistory.filter(h => h.query !== query)
    ].slice(0, 5); // Keep only last 5 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  
  const removeHistoryItem = (index: number) => {
    const newHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedSearchQuery, advancedCriteria],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim() && !advancedCriteria) return null;
      
      const isAi = detectAiQuery(debouncedSearchQuery);
      setIsAiQuery(isAi);

      // Save to history when search is performed
      if (debouncedSearchQuery.trim()) {
        saveToHistory(debouncedSearchQuery);
      }

      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { 
          query: debouncedSearchQuery,
          searchType: isAi ? 'ai' : 'search',
          advancedCriteria
        }
      });

      if (error) throw error;
      return data as SearchResult;
    },
    enabled: debouncedSearchQuery.length > 2 || !!advancedCriteria
  });

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(e.target.value.length > 0);
    setShowHistory(false);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setAdvancedCriteria(null);
  };
  
  const handleAdvancedSearch = (criteria: SearchCriteria) => {
    setAdvancedCriteria(criteria);
    setShowResults(true);
  };
  
  const handleSelectHistory = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    setShowResults(true);
  };
  
  // Count total results
  const totalResults = searchResults?.results 
    ? (searchResults.results.referrals?.length || 0) + 
      (searchResults.results.patients?.length || 0) + 
      (searchResults.results.organizations?.length || 0)
    : 0;
  
  // Highlight matched text in results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 px-0.5">{part}</mark>
        : part
    );
  };

  const handleResultClick = (type: string, id: string) => {
    // Navigate to the specific item - Fixed organization route
    switch (type) {
      case 'referral':
        navigate(`/referral/${id}`);
        break;
      case 'patient':
        navigate(`/patient/${id}`);
        break;
      case 'organization':
        navigate(`/organizations/${id}`); // Fixed: changed from /organization to /organizations
        break;
      default:
        console.log(`Unknown type: ${type}`);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  const handleSuggestedAction = (action: { type: string; path?: string; item?: string; label: string }) => {
    if (action.type === 'navigate' && action.path) {
      navigate(action.path);
    } else if (action.type === 'create' && action.item) {
      switch (action.item) {
        case 'referral':
          setShowAddReferral(true);
          break;
        case 'visit':
          setShowScheduleVisit(true);
          break;
        case 'organization':
          setShowAddOrganization(true);
          break;
        case 'quick':
          setShowQuickAdd(true);
          break;
      }
    }
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <>
      <div ref={searchRef} className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
          <Input
            type="text"
            placeholder="Search referrals by name, MRN, facility..."
            value={searchQuery}
            onChange={handleInputChange}
            className="pl-10 pr-20 py-2 w-full text-sm bg-background"
            onFocus={() => {
              if (searchQuery.length === 0) {
                setShowHistory(true);
                setShowResults(false);
              } else if (searchQuery.length > 0) {
                setShowResults(true);
                setShowHistory(false);
              }
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {isAiQuery && (
              <MessageCircle className="text-blue-500 h-4 w-4" />
            )}
          </div>
        </div>
        
        {/* Advanced Search Link */}
        <button
          onClick={() => setShowAdvancedSearch(true)}
          className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
        >
          <Filter className="w-3 h-3" />
          Advanced Search
        </button>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <SearchHistoryDropdown
            history={searchHistory}
            onSelectHistory={handleSelectHistory}
            onClearHistory={clearHistory}
            onRemoveItem={removeHistoryItem}
          />
        )}

        {showResults && debouncedSearchQuery.length > 2 && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg bg-background border">
            <CardContent className="p-0">
              {/* Results count */}
              {!isLoading && searchResults && totalResults > 0 && (
                <div className="px-4 py-2 bg-muted/50 border-b">
                  <p className="text-xs font-medium text-foreground">
                    {totalResults} result{totalResults !== 1 ? 's' : ''} found
                  </p>
                </div>
              )}
              
              {isLoading ? (
                <div className="p-4 text-center bg-background">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
                </div>
              ) : searchResults?.type === 'ai_response' ? (
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">AI Assistant</p>
                      <p className="text-sm text-blue-800 mt-1">{searchResults.response}</p>
                      {searchResults.suggestedAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-blue-600 border-blue-300 hover:bg-blue-100"
                          onClick={() => handleSuggestedAction(searchResults.suggestedAction!)}
                        >
                          {searchResults.suggestedAction.type === 'create' ? (
                            <Plus className="h-3 w-3 mr-1" />
                          ) : (
                            <ExternalLink className="h-3 w-3 mr-1" />
                          )}
                          {searchResults.suggestedAction.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : searchResults?.results && (
                <div className="bg-white">
                  {/* Referrals Results */}
                  {searchResults.results.referrals.length > 0 && (
                    <div className="border-b border-gray-200">
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700 flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        Referrals
                      </div>
                      {searchResults.results.referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 bg-background transition-colors"
                          onClick={() => handleResultClick('referral', referral.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">
                                {highlightMatch(referral.patient_name, debouncedSearchQuery)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Facility:</span> {highlightMatch(referral.organizations?.name || 'N/A', debouncedSearchQuery)}
                              </p>
                              {referral.referring_physician && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Physician:</span> {highlightMatch(referral.referring_physician, debouncedSearchQuery)}
                                </p>
                              )}
                              {referral.diagnosis && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Diagnosis:</span> {highlightMatch(referral.diagnosis, debouncedSearchQuery)}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              referral.status === 'admitted' ? 'bg-green-100 text-green-800' :
                              referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {referral.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Patients Results */}
                  {searchResults.results.patients.length > 0 && (
                    <div className="border-b border-gray-200">
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Patients
                      </div>
                      {searchResults.results.patients.map((patient) => (
                        <div
                          key={patient.id}
                          className="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 bg-background transition-colors"
                          onClick={() => handleResultClick('patient', patient.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">
                                {highlightMatch(`${patient.first_name} ${patient.last_name}`, debouncedSearchQuery)}
                              </p>
                              {patient.diagnosis && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {highlightMatch(patient.diagnosis, debouncedSearchQuery)}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              patient.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {patient.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Organizations Results */}
                  {searchResults.results.organizations.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700 flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        Organizations
                      </div>
                      {searchResults.results.organizations.map((org) => (
                        <div
                          key={org.id}
                          className="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 bg-background transition-colors"
                          onClick={() => handleResultClick('organization', org.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">
                                {highlightMatch(org.name, debouncedSearchQuery)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {org.type} {org.contact_person && `• Contact: ${highlightMatch(org.contact_person, debouncedSearchQuery)}`}
                              </p>
                            </div>
                            {org.assigned_marketer && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {org.assigned_marketer}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.results.referrals.length === 0 && 
                   searchResults.results.patients.length === 0 && 
                   searchResults.results.organizations.length === 0 && (
                    <div className="p-4 text-center bg-background">
                      <p className="text-sm text-foreground">No results found for "{debouncedSearchQuery}"</p>
                      <p className="text-xs mt-1 text-muted-foreground">Try a different search term or use Advanced Search</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Components */}
      <AddReferralDialog 
        open={showAddReferral} 
        onOpenChange={setShowAddReferral} 
      />
      <AddOrganizationDialog 
        open={showAddOrganization} 
        onOpenChange={setShowAddOrganization} 
      />
      <ScheduleVisitDialog 
        open={showScheduleVisit} 
        onOpenChange={setShowScheduleVisit} 
      />
      <QuickAddDialog 
        open={showQuickAdd} 
        onOpenChange={setShowQuickAdd} 
      />
      <AdvancedSearchModal
        open={showAdvancedSearch}
        onOpenChange={setShowAdvancedSearch}
        onSearch={handleAdvancedSearch}
      />
    </>
  );
};

export default GlobalSearchBar;
