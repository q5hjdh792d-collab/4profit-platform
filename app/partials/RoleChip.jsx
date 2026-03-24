'use client'

import React from 'react'

export default function RoleChip() {
  // Purged session fetch; keep simple guest chip for clean UI and no API deps
  return (
    <span className="text-xs bg-white/50 text-slate-700 px-2 py-1 rounded-md backdrop-blur">
      Guest
    </span>
  )
}
