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
    lastSeen?: string
}

interface ChatStore {
    messages: Message[]
    users: User[]
    selectedUser: User | null
    isUsersLoading: boolean
    isMessagesLoading: boolean
    smartReplies: string[]
    isFetchingReplies: boolean
    chatSummary: string | null
    isSummarizing: boolean

    getUsers: () => Promise<void>
    getMessages: (userId: string) => Promise<void>
    setSelectedUser: (user: User | null) => void
    sendMessages: (messageData: { text?: string; image?: string }) => Promise<void>
    editMessage: (messageId: string, text: string) => Promise<void>
    deleteMessage: (messageId: string) => Promise<void>
    subscribeToMessages: () => void
    unsubscribeToMessages: () => void
    getSmartReplies: (messageText: string) => Promise<void>
    clearSmartReplies: () => void
    summarizeChat: (userId: string) => Promise<void>
    clearSummary: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    smartReplies: [],
    isFetchingReplies: false,
    chatSummary: null,
    isSummarizing: false,

    setSelectedUser: (user) => set({ selectedUser: user }),

    getUsers: async () => {
        set({ isUsersLoading: true })
        try {
            const res = await AxiosInstance.get('/users/friends')
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

    editMessage: async (messageId: string, text: string) => {
        try {
            await AxiosInstance.put(`/messages/${messageId}`, { text });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to edit message')
            } else {
                toast.error('Failed to edit message')
            }
        }
    },

    deleteMessage: async (messageId: string) => {
        try {
            await AxiosInstance.delete(`/messages/${messageId}`);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to delete message')
            } else {
                toast.error('Failed to delete message')
            }
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");
        socket.off("messageEdited");
        socket.off("messageDeleted");

        socket.on("newMessage", (newMessage: Message) => {
            set((state) => ({
                messages: [...state.messages, newMessage],
            }));
        });

        socket.on("messageEdited", (editedMessage: Message) => {
            set((state) => ({
                messages: state.messages.map((m) => m._id === editedMessage._id ? editedMessage : m),
            }));
        });

        socket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
            set((state) => ({
                messages: state.messages.filter((m) => m._id !== messageId),
            }));
        });
    },

    unsubscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket?.off("newMessage")
        socket?.off("messageEdited")
        socket?.off("messageDeleted")
    },

    getSmartReplies: async (messageText: string) => {
        set({ isFetchingReplies: true, smartReplies: [] })
        try {
            const res = await AxiosInstance.post('/ai/smart-replies', { messageText })
            set({ smartReplies: res.data })
        } catch (error: unknown) {
            console.error("Failed to fetch smart replies", error)
        } finally {
            set({ isFetchingReplies: false })
        }
    },

    clearSmartReplies: () => set({ smartReplies: [] }),

    summarizeChat: async (userId: string) => {
        set({ isSummarizing: true, chatSummary: null })
        try {
            const res = await AxiosInstance.get(`/ai/summary/user/${userId}`)
            set({ chatSummary: res.data.summary })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to summarize chat')
            } else {
                toast.error('Failed to summarize chat')
            }
        } finally {
            set({ isSummarizing: false })
        }
    },

    clearSummary: () => set({ chatSummary: null }),
}))
