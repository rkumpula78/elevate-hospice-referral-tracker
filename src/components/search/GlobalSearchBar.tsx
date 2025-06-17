
import React, { useState, useRef, useEffect } from 'react';
import { Search, MessageCircle, User, Building2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: string;
  results?: {
    referrals: any[];
    patients: any[];
    organizations: any[];
  };
  response?: string;
}

const GlobalSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isAiQuery, setIsAiQuery] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Detect if this looks like an AI query
  const detectAiQuery = (query: string) => {
    const aiPatterns = [
      /^(show me|find|what|how many|list|display)/i,
      /\b(all|pending|admitted|scheduled|from|last|this)\b/i
    ];
    return aiPatterns.some(pattern => pattern.test(query));
  };

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      
      const isAi = detectAiQuery(searchQuery);
      setIsAiQuery(isAi);

      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { 
          query: searchQuery,
          searchType: isAi ? 'ai' : 'search'
        }
      });

      if (error) throw error;
      return data as SearchResult;
    },
    enabled: searchQuery.length > 2
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
  };

  const handleResultClick = (type: string, id: string) => {
    // Navigate to the specific item
    switch (type) {
      case 'referral':
        navigate(`/referral/${id}`);
        break;
      case 'patient':
        navigate(`/patient/${id}`);
        break;
      case 'organization':
        navigate(`/organization/${id}`);
        break;
      default:
        console.log(`Unknown type: ${type}`);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search patients, referrals, organizations... or ask AI"
          value={searchQuery}
          onChange={handleInputChange}
          className="pl-10 pr-4 py-2 w-full text-sm"
          onFocus={() => searchQuery.length > 0 && setShowResults(true)}
        />
        {isAiQuery && (
          <MessageCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
        )}
      </div>

      {showResults && searchQuery.length > 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            ) : searchResults?.type === 'ai_response' ? (
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI Assistant</p>
                    <p className="text-sm text-blue-800 mt-1">{searchResults.response}</p>
                  </div>
                </div>
              </div>
            ) : searchResults?.results && (
              <div>
                {/* Referrals Results */}
                {searchResults.results.referrals.length > 0 && (
                  <div className="border-b">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700 flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      Referrals
                    </div>
                    {searchResults.results.referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleResultClick('referral', referral.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{referral.patient_name}</p>
                            <p className="text-xs text-gray-600">
                              {referral.organizations?.name} • Status: {referral.status}
                            </p>
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
                  <div className="border-b">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-700 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Patients
                    </div>
                    {searchResults.results.patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleResultClick('patient', patient.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{patient.first_name} {patient.last_name}</p>
                            <p className="text-xs text-gray-600">{patient.diagnosis}</p>
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
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleResultClick('organization', org.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{org.name}</p>
                            <p className="text-xs text-gray-600">
                              {org.type} • Contact: {org.contact_person}
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
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different search term or ask the AI assistant</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearchBar;
