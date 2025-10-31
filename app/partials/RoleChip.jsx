'use client'

import React from 'react'

export default function RoleChip() {
  const [role, setRole] = React.useState('Guest')
  React.useEffect(()=>{
    fetch('/api/session').then(r=>r.json()).then(j=>{
      if (j?.user?.role) setRole(j.user.role)
    }).catch(()=>{})
  },[])
  return (
    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
      {role}
    </span>
  )
}
