import { create } from 'zustand'
import toast from 'react-hot-toast'
import { AxiosInstance } from '../lib/axios'
import axios from 'axios'
import { useAuthStore } from './useAuthStore'

export interface GroupMember {
    _id: string
    fullName: string
    email: string
    profilePic?: string
    lastSeen?: string
}

export interface Group {
    _id: string
    name: string
    groupIcon: string
    members: GroupMember[]
    admins: GroupMember[]
    createdBy: GroupMember
    createdAt: string
    updatedAt: string
}

export interface GroupMessage {
    _id: string
    senderId: string | { _id: string; fullName: string; profilePic?: string }
    groupId: string
    text?: string | null
    image?: string | null
    createdAt: string
}

interface GroupStore {
    groups: Group[]
    selectedGroup: Group | null
    groupMessages: GroupMessage[]
    isLoadingGroups: boolean
    isLoadingGroupMessages: boolean
    isCreatingGroup: boolean
    isUpdatingGroupPhoto: boolean
    chatSummary: string | null
    isSummarizing: boolean

    getGroups: () => Promise<void>
    createGroup: (data: { name: string; members: string[] }) => Promise<void>
    getGroupMessages: (groupId: string) => Promise<void>
    sendGroupMessage: (groupId: string, data: { text?: string; image?: string }) => Promise<void>
    editGroupMessage: (messageId: string, text: string) => Promise<void>
    deleteGroupMessage: (messageId: string) => Promise<void>
    setSelectedGroup: (group: Group | null) => void
    addMember: (groupId: string, userId: string) => Promise<void>
    removeMember: (groupId: string, userId: string) => Promise<void>
    promoteToAdmin: (groupId: string, userId: string) => Promise<void>
    updateGroup: (groupId: string, data: { name?: string; groupIcon?: string }) => Promise<void>
    updateGroupPhoto: (groupId: string, groupIcon: string) => Promise<void>
    deleteGroup: (groupId: string) => Promise<void>
    subscribeToGroupEvents: () => void
    unsubscribeFromGroupEvents: () => void
    summarizeChat: (groupId: string) => Promise<void>
    clearSummary: () => void
}

const getSocket = () => {
    return useAuthStore.getState().socket
}

export const useGroupStore = create<GroupStore>((set, get) => ({
    groups: [],
    selectedGroup: null,
    groupMessages: [],
    isLoadingGroups: false,
    isLoadingGroupMessages: false,
    isCreatingGroup: false,
    isUpdatingGroupPhoto: false,
    chatSummary: null,
    isSummarizing: false,

    getGroups: async () => {
        set({ isLoadingGroups: true })
        try {
            const res = await AxiosInstance.get('/groups')
            set({ groups: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to load groups')
            } else {
                toast.error('Failed to load groups')
            }
        } finally {
            set({ isLoadingGroups: false })
        }
    },

    createGroup: async (data) => {
        set({ isCreatingGroup: true })
        try {
            const res = await AxiosInstance.post('/groups', data)
            set((state) => ({ groups: [res.data, ...state.groups] }))
            toast.success('Group created!')

            // Join the socket room
            const socket = getSocket()
            if (socket) {
                socket.emit('joinGroup', res.data._id)
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to create group')
            } else {
                toast.error('Failed to create group')
            }
        } finally {
            set({ isCreatingGroup: false })
        }
    },

    getGroupMessages: async (groupId: string) => {
        set({ isLoadingGroupMessages: true })
        try {
            const res = await AxiosInstance.get(`/groups/${groupId}/messages`)
            set({ groupMessages: res.data })
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to load messages')
            } else {
                toast.error('Failed to load messages')
            }
        } finally {
            set({ isLoadingGroupMessages: false })
        }
    },

    sendGroupMessage: async (groupId, data) => {
        try {
            await AxiosInstance.post(`/groups/${groupId}/messages`, data)
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to send message')
            } else {
                toast.error('Failed to send message')
            }
        }
    },

    editGroupMessage: async (messageId: string, text: string) => {
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

    deleteGroupMessage: async (messageId: string) => {
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

    setSelectedGroup: (group) => set({ selectedGroup: group, groupMessages: [] }),

    addMember: async (groupId, userId) => {
        try {
            const res = await AxiosInstance.post(`/groups/${groupId}/members`, { userId })
            set((state) => ({
                groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
            }))
            toast.success('Member added!')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to add member')
            } else {
                toast.error('Failed to add member')
            }
        }
    },

    removeMember: async (groupId, userId) => {
        try {
            const res = await AxiosInstance.delete(`/groups/${groupId}/members/${userId}`)
            set((state) => ({
                groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
            }))
            toast.success('Member removed')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to remove member')
            } else {
                toast.error('Failed to remove member')
            }
        }
    },

    promoteToAdmin: async (groupId, userId) => {
        try {
            const res = await AxiosInstance.post(`/groups/${groupId}/admins/${userId}`)
            set((state) => ({
                groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
            }))
            toast.success('User promoted to admin!')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to promote user')
            } else {
                toast.error('Failed to promote user')
            }
        }
    },

    updateGroup: async (groupId, data) => {
        try {
            const res = await AxiosInstance.put(`/groups/${groupId}`, data)
            set((state) => ({
                groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
            }))
            toast.success('Group updated!')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to update group')
            } else {
                toast.error('Failed to update group')
            }
        }
    },

    updateGroupPhoto: async (groupId: string, groupIcon: string) => {
        set({ isUpdatingGroupPhoto: true })
        try {
            const res = await AxiosInstance.put(`/groups/${groupId}/photo`, { groupIcon })
            set((state) => ({
                groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
                selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
            }))
            toast.success('Group photo updated successfully')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to update group photo')
            } else {
                toast.error('Failed to update group photo')
            }
        } finally {
            set({ isUpdatingGroupPhoto: false })
        }
    },

    deleteGroup: async (groupId) => {
        try {
            await AxiosInstance.delete(`/groups/${groupId}`)
            set((state) => ({
                groups: state.groups.filter((g) => g._id !== groupId),
                selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
                groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
            }))
            toast.success('Group deleted')
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Failed to delete group')
            } else {
                toast.error('Failed to delete group')
            }
        }
    },

    subscribeToGroupEvents: () => {
        const socket = getSocket()
        if (!socket) return

        socket.on("newGroupMessage", (newMessage: GroupMessage) => {
            const { selectedGroup } = get()
            if (selectedGroup && newMessage.groupId === selectedGroup._id) {
                set((state) => ({
                    groupMessages: [...state.groupMessages, newMessage],
                }))
            }
        })

        socket.on("messageEdited", (editedMessage: GroupMessage) => {
            const { selectedGroup } = get()
            if (selectedGroup && editedMessage.groupId === selectedGroup._id) {
                set((state) => ({
                    groupMessages: state.groupMessages.map((m) => m._id === editedMessage._id ? editedMessage : m),
                }))
            }
        })

        socket.on("messageDeleted", ({ messageId, groupId }: { messageId: string, groupId: string }) => {
            const { selectedGroup } = get()
            if (selectedGroup && groupId === selectedGroup._id) {
                set((state) => ({
                    groupMessages: state.groupMessages.filter((m) => m._id !== messageId),
                }))
            }
        })

        socket.on("groupCreated", (group: Group) => {
            set((state) => {
                const exists = state.groups.some((g) => g._id === group._id)
                if (exists) return state
                return { groups: [group, ...state.groups] }
            })
            // Join the room
            socket.emit('joinGroup', group._id)
        })

        socket.on("groupUpdated", (updatedGroup: Group) => {
            set((state) => ({
                groups: state.groups.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
                selectedGroup: state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup,
            }))
        })

        socket.on("addedToGroup", (group: Group) => {
            set((state) => {
                const exists = state.groups.some((g) => g._id === group._id)
                if (exists) return state
                return { groups: [group, ...state.groups] }
            })
            socket.emit('joinGroup', group._id)
            toast.success(`You were added to "${group.name}"`)
        })

        socket.on("removedFromGroup", ({ groupId }: { groupId: string }) => {
            set((state) => ({
                groups: state.groups.filter((g) => g._id !== groupId),
                selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
                groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
            }))
            toast('You were removed from a group', { icon: '👋' })
        })

        socket.on("groupDeleted", ({ groupId }: { groupId: string }) => {
            set((state) => ({
                groups: state.groups.filter((g) => g._id !== groupId),
                selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
                groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
            }))
            toast('A group was deleted', { icon: '🗑️' })
        })
    },

    unsubscribeFromGroupEvents: () => {
        const socket = getSocket()
        if (!socket) return
        socket.off("newGroupMessage")
        socket.off("messageEdited")
        socket.off("messageDeleted")
        socket.off("groupCreated")
        socket.off("groupUpdated")
        socket.off("addedToGroup")
        socket.off("removedFromGroup")
        socket.off("groupDeleted")
    },

    summarizeChat: async (groupId: string) => {
        set({ isSummarizing: true, chatSummary: null })
        try {
            const res = await AxiosInstance.get(`/ai/summary/group/${groupId}`)
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
