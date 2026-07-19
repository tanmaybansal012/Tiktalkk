import { create } from 'zustand'
import toast from 'react-hot-toast'
import { AxiosInstance } from '../lib/axios'
import axios from 'axios'
import { useAuthStore } from './useAuthStore'

export interface Message {
    _id: string
    senderId: string
    receiverId: string
    image?: string | null
    text?: string | null
    createdAt: string
}

export interface User {
    _id: string
    fullName: string
    email: string
    profilePic?: string
}

interface ChatStore {
    messages: Message[]
    users: User[]
    selectedUser: User | null
    isUsersLoading: boolean
    isMessagesLoading: boolean

    getUsers: () => Promise<void>
    getMessages: (userId: string) => Promise<void>
    setSelectedUser: (user: User | null) => void
    sendMessages: (messageData: { text?: string; image?: string }) => Promise<void>
    subscribeToMessages: () => void
    unsubscribeToMessages: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    setSelectedUser: (user) => set({ selectedUser: user }),

    getUsers: async () => {
        set({ isUsersLoading: true })
        try {
            const res = await AxiosInstance.get('/messages/users')
            set({ users: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Something went wrong!')
            } else {
                toast.error('Something went wrong!')
            }
        } finally {
            set({ isUsersLoading: false })
        }
    },

    getMessages: async (userId: string) => {
        set({ isMessagesLoading: true })
        try {
            const res = await AxiosInstance.get(`/messages/${userId}`)
            set({ messages: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Something went wrong!')
            } else {
                toast.error('Something went wrong!')
            }
        } finally {
            set({ isMessagesLoading: false })
        }
    },

    sendMessages: async (messageData) => {
        const { selectedUser } = get();
        if (!selectedUser) return;
        try {
            await AxiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                messageData
            );
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Something went wrong!')
            } else {
                toast.error('Something went wrong!')
            }
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");

        socket.on("newMessage", (newMessage: Message) => {
            set((state) => ({
                messages: [...state.messages, newMessage],
            }));
        });
    },

    unsubscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage")
    }
}))
