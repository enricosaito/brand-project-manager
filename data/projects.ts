import type { Project } from "@/lib/types"

import { unsplash } from "./images"

export const projects: Project[] = [
  {
    id: "p_brand",
    name: "Brand Identity",
    description:
      "A full identity refresh: logo system, typography, color and voice for the next decade of Silva Gym.",
    type: "brand",
    status: "review",
    coverUrl: unsplash("1561070791-2526d30994b5"),
    ownerId: "m_alex",
    startDate: "2026-06-01",
    dueDate: "2026-10-15",
    createdAt: "2026-05-28T09:12:00",
    updatedAt: "2026-09-13T16:40:00",
  },
  {
    id: "p_web",
    name: "Website Redesign",
    description:
      "Rebuilding silvagym.com around the new identity with a lighter editorial layout and a clearer product story.",
    type: "website",
    status: "in-progress",
    coverUrl: unsplash("1541462608143-67571c6738dd"),
    ownerId: "m_michael",
    startDate: "2026-07-15",
    dueDate: "2026-11-30",
    createdAt: "2026-07-10T11:00:00",
    updatedAt: "2026-09-14T09:05:00",
  },
  {
    id: "p_summer",
    name: "Summer Campaign",
    description:
      "Seasonal campaign across out-of-home, digital and retail. A warm, sun-bleached palette and playful type.",
    type: "campaign",
    status: "completed",
    coverUrl: unsplash("1515886657613-9f3515b0c78f"),
    ownerId: "m_lena",
    startDate: "2026-04-01",
    dueDate: "2026-08-15",
    createdAt: "2026-03-24T14:30:00",
    updatedAt: "2026-08-18T10:15:00",
  },
  {
    id: "p_social",
    name: "Social Launch",
    description:
      "Launching the brand on social with a six-week content system, editable templates and a motion toolkit.",
    type: "social",
    status: "in-progress",
    coverUrl: unsplash("1503342217505-b0a15ec3261c"),
    ownerId: "m_jonas",
    startDate: "2026-08-20",
    dueDate: "2026-10-05",
    createdAt: "2026-08-17T08:45:00",
    updatedAt: "2026-09-12T17:20:00",
  },
  {
    id: "p_pack",
    name: "Packaging",
    description:
      "A sustainable packaging system for the Core collection: kraft substrates, one-color print and tactile finishes.",
    type: "packaging",
    status: "planning",
    coverUrl: unsplash("1595246140625-573b715d11dc"),
    ownerId: "m_sarah",
    startDate: "2026-09-20",
    dueDate: "2026-12-12",
    createdAt: "2026-09-08T13:10:00",
    updatedAt: "2026-09-10T11:30:00",
  },
  {
    id: "p_guide",
    name: "Brand Guidelines",
    description:
      "The living reference for how the brand looks, sounds and behaves, built for internal teams and partners.",
    type: "internal",
    status: "in-progress",
    coverUrl: unsplash("1523726491678-bf852e717f6a"),
    ownerId: "m_priya",
    startDate: "2026-08-01",
    dueDate: "2026-10-30",
    createdAt: "2026-07-29T10:00:00",
    updatedAt: "2026-09-11T15:50:00",
  },
]
