import React, { createContext, useState, useEffect, useContext } from 'react';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
    // Add weight to the profile state
    const [profile, setProfile] = useState({ 
        userId: null, 
        username: 'Guest', 
        profileImage: null, 
        weight: null 
    });
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        setLoading(true);
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile/${userId}`);
            if (response.ok) {
                const data = await response.json();
                // console.log('fetchProfile - API response data:', data); // Debug log
                setProfile({
                    userId: data.id,
                    username: data.username,
                    profileImage: data.profile_image_url ? `${process.env.REACT_APP_API_URL}${data.profile_image_url}` : null,
                    weight: data.weight || null // Set weight from fetched data
                });
                // Note: console.log(profile) here will show the *previous* state due to async nature of setProfile
                // To see the updated state, you'd need another useEffect or a callback.
                // For now, checking 'data' is sufficient.
            } else {
                console.error('Failed to fetch profile, using default.');
                setProfile({ userId: null, username: 'Guest', profileImage: null, weight: null });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile({ userId: null, username: 'Guest', profileImage: null, weight: null });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    // This function can be used for general profile updates (like username/image)
    const updateProfileContext = (newProfileData) => {
        const { id, username, profile_image_url, weight } = newProfileData;
        
        let finalProfileImageUrl = profile_image_url;
        if (profile_image_url && !profile_image_url.startsWith('http') && !profile_image_url.startsWith('data:')) {
            finalProfileImageUrl = `${process.env.REACT_APP_API_URL}${profile_image_url}`;
        }

        setProfile(prev => ({
            ...prev,
            userId: id || prev.userId,
            username: username || prev.username,
            profileImage: finalProfileImageUrl || prev.profileImage,
            weight: weight !== undefined ? weight : prev.weight
        }));
    };
    
    // New function specifically for updating weight
    const updateWeight = async (newWeight) => {
        const userId = localStorage.getItem('userId'); // Get userId directly
        if (!userId) throw new Error("User not logged in");
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: parseFloat(newWeight) }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to update weight');
        }
        
        const updatedProfileData = await response.json();
        // Update the context with the full updated profile from the server
        updateProfileContext(updatedProfileData); 
    };

    const value = {
        profile,
        loading,
        updateProfileContext,
        updateWeight, // Expose the new function
        refreshProfile: fetchProfile
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};