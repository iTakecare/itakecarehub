import React from 'react'
import { AdminChatDashboard } from '@/components/chat/AdminChatDashboard'

const AdminChatPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chat en direct</h1>
        <p className="text-muted-foreground">Gérez les conversations avec les visiteurs du catalogue</p>
      </div>
      <AdminChatDashboard />
    </div>
  )
}

export default AdminChatPage