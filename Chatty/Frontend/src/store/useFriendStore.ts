import { create } from 'zustand'
import toast from 'react-hot-toast'
import { AxiosInstance } from '../lib/axios'
import axios from 'axios'

export interface FriendUser {
    _id: string
    fullName: string
    email: string
    profilePic?: string
    lastSeen?: string
}

interface FriendStore {
    friends: FriendUser[]
    friendRequests: { sent: FriendUser[]; received: FriendUser[] }
    searchResults: FriendUser[]
    isLoadingFriends: boolean
    isSearching: boolean
    isSendingRequest: Record<string, boolean>

    getFriends: () => Promise<void>
    getFriendRequests: () => Promise<void>
    searchUsers: (query: string) => Promise<void>
    clearSearchResults: () => void
    sendFriendRequest: (userId: string) => Promise<void>
    acceptFriendRequest: (userId: string) => Promise<void>
    rejectFriendRequest: (userId: string) => Promise<void>
    unfriend: (userId: string) => Promise<void>
    subscribeToFriendEvents: () => void
    unsubscribeFromFriendEvents: () => void
}

import { useAuthStore } from './useAuthStore'

const getSocket = () => {
    return useAuthStore.getState().socket
}

export const useFriendStore = create<FriendStore>((set, get) => ({
    friends: [],
    friendRequests: { sent: [], received: [] },
    searchResults: [],
    isLoadingFriends: false,
    isSearching: false,
    isSendingRequest: {},

    getFriends: async () => {
        set({ isLoadingFriends: true })
        try {
            const res = await AxiosInstance.get('/users/friends')
            set({ friends: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to load friends')
            } else {
                toast.error('Failed to load friends')
            }
        } finally {
            set({ isLoadingFriends: false })
        }
    },

    getFriendRequests: async () => {
        try {
            const res = await AxiosInstance.get('/users/friend-requests')
            set({ friendRequests: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to load friend requests')
            } else {
                toast.error('Failed to load friend requests')
            }
        }
    },

    searchUsers: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [] })
            return
        }
        set({ isSearching: true })
        try {
            const res = await AxiosInstance.get(`/users/search?query=${encodeURIComponent(query)}`)
            set({ searchResults: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Search failed')
            } else {
                toast.error('Search failed')
            }
        } finally {
            set({ isSearching: false })
        }
    },

    clearSearchResults: () => set({ searchResults: [] }),

    sendFriendRequest: async (userId: string) => {
        set((state) => ({
            isSendingRequest: { ...state.isSendingRequest, [userId]: true },
        }))
        try {
            await AxiosInstance.post(`/users/friend-request/${userId}`)
            toast.success('Friend request sent!')

            // Optimistically move user from search results to sent requests
            const user = get().searchResults.find((u) => u._id === userId)
            if (user) {
                set((state) => ({
                    searchResults: state.searchResults.filter((u) => u._id !== userId),
                    friendRequests: {
                        ...state.friendRequests,
                        sent: [...state.friendRequests.sent, user],
                    },
                }))
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to send request')
            } else {
                toast.error('Failed to send request')
            }
        } finally {
            set((state) => ({
                isSendingRequest: { ...state.isSendingRequest, [userId]: false },
            }))
        }
    },

    acceptFriendRequest: async (userId: string) => {
        try {
            await AxiosInstance.post(`/users/friend-request/${userId}/accept`)
            toast.success('Friend request accepted!')

            // Optimistically update state
            const user = get().friendRequests.received.find((u) => u._id === userId)
            set((state) => ({
                friendRequests: {
                    ...state.friendRequests,
                    received: state.friendRequests.received.filter((u) => u._id !== userId),
                },
                friends: user ? [...state.friends, user] : state.friends,
            }))
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to accept request')
            } else {
                toast.error('Failed to accept request')
            }
        }
    },

    rejectFriendRequest: async (userId: string) => {
        try {
            await AxiosInstance.post(`/users/friend-request/${userId}/reject`)
            toast.success('Friend request rejected')

            set((state) => ({
                friendRequests: {
                    ...state.friendRequests,
                    received: state.friendRequests.received.filter((u) => u._id !== userId),
                },
            }))
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to reject request')
            } else {
                toast.error('Failed to reject request')
            }
        }
    },

    unfriend: async (userId: string) => {
        try {
            await AxiosInstance.delete(`/users/friend/${userId}`)
            toast.success('Unfriended')

            set((state) => ({
                friends: state.friends.filter((u) => u._id !== userId),
            }))
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to unfriend')
            } else {
                toast.error('Failed to unfriend')
            }
        }
    },

    subscribeToFriendEvents: () => {
        const socket = getSocket()
        if (!socket) return

        socket.on("friendRequestReceived", (sender: FriendUser) => {
            set((state) => ({
                friendRequests: {
                    ...state.friendRequests,
                    received: [...state.friendRequests.received, sender],
                },
            }))
            toast.success(`${sender.fullName} sent you a friend request!`)
        })

        socket.on("friendRequestAccepted", (user: FriendUser) => {
            set((state) => ({
                friendRequests: {
                    ...state.friendRequests,
                    sent: state.friendRequests.sent.filter((u) => u._id !== user._id),
                },
                friends: [...state.friends, user],
            }))
            toast.success(`${user.fullName} accepted your friend request!`)
        })
    },

    unsubscribeFromFriendEvents: () => {
        const socket = getSocket()
        if (!socket) return
        socket.off("friendRequestReceived")
        socket.off("friendRequestAccepted")
    },
}))
