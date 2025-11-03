import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const AddFriends = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [toasts, setToasts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchFriendRequests();
    fetchAllUsers();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/friends/requests');
      setIncomingRequests(res.data.incoming || []);
      setOutgoingRequests(res.data.outgoing || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get('http://localhost:5000/api/friends/users');
      setAllUsers(res.data);
    } catch (error) {
      console.error('Error fetching all users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const showToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration: 5000 }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/friends/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Error searching users:', error);
      showToast('Failed to search users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change - update search results in real-time
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/friends/send', { userId });
      showToast(res.data.message || 'Friend request sent!', res.data.isFriend ? 'success' : 'info');
      
      if (res.data.isFriend) {
        // Refresh requests if auto-accepted
        fetchFriendRequests();
        fetchAllUsers(); // Refresh user list
      } else {
        // Update search results
        setSearchResults(searchResults.map(u => 
          u._id === userId ? { ...u, hasPendingRequest: true } : u
        ));
        // Update all users list
        setAllUsers(allUsers.map(u => 
          u._id === userId ? { ...u, hasPendingRequest: true } : u
        ));
        fetchFriendRequests();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send friend request', 'error');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post('http://localhost:5000/api/friends/accept', { requestId });
      showToast('Friend request accepted!', 'success');
      fetchFriendRequests();
      fetchAllUsers(); // Refresh user list to update friend status
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.post('http://localhost:5000/api/friends/reject', { requestId });
      showToast('Friend request rejected', 'info');
      fetchFriendRequests();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      await axios.post('http://localhost:5000/api/friends/cancel', { userId });
      showToast('Friend request cancelled', 'info');
      setSearchResults(searchResults.map(u => 
        u._id === userId ? { ...u, hasPendingRequest: false } : u
      ));
      setAllUsers(allUsers.map(u => 
        u._id === userId ? { ...u, hasPendingRequest: false } : u
      ));
      fetchFriendRequests();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to cancel request', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
            className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Friend Requests</h3>
            <div className="space-y-2">
              {incomingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg"
                >
                  <div className="flex items-center">
                    {request.from.avatar ? (
                      <img
                        src={request.from.avatar}
                        alt={request.from.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {request.from.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-900">{request.from.username}</p>
                      <p className="text-xs text-gray-500">Wants to be your friend</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Search Results ({searchResults.length})
            </h3>
            <div className="space-y-2">
              {searchResults.map((userResult) => (
                <div
                  key={userResult._id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    {userResult.avatar ? (
                      <img
                        src={userResult.avatar}
                        alt={userResult.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {userResult.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-900">{userResult.username}</p>
                      <p className="text-xs text-gray-500">{userResult.email}</p>
                    </div>
                  </div>
                  <div>
                    {userResult.isFriend ? (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        Friends
                      </span>
                    ) : userResult.hasPendingRequest ? (
                      <button
                        onClick={() => handleCancelRequest(userResult._id)}
                        className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(userResult._id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Users List (when no search) */}
        {searchResults.length === 0 && searchQuery.trim() === '' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                All Users ({allUsers.length})
              </h3>
              {loadingUsers && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              )}
            </div>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading users...</p>
                </div>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allUsers.map((userResult) => (
                  <div
                    key={userResult._id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      {userResult.avatar ? (
                        <img
                          src={userResult.avatar}
                          alt={userResult.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {userResult.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-900">{userResult.username}</p>
                        <p className="text-xs text-gray-500">{userResult.email}</p>
                        {userResult.status === 'online' && (
                          <span className="text-xs text-green-500 flex items-center mt-0.5">
                            <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {userResult.isFriend ? (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                          Friends
                        </span>
                      ) : userResult.hasPendingRequest ? (
                        <button
                          onClick={() => handleCancelRequest(userResult._id)}
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(userResult._id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outgoing Requests */}
        {outgoingRequests.length > 0 && searchResults.length === 0 && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sent Requests ({outgoingRequests.length})</h3>
            <div className="space-y-2">
              {outgoingRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    {request.to.avatar ? (
                      <img
                        src={request.to.avatar}
                        alt={request.to.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {request.to.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-900">{request.to.username}</p>
                      <p className="text-xs text-gray-500">Request sent</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(request.to._id)}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default AddFriends;

