import type { Task } from "@/lib/types"

export const tasks: Task[] = [
  // Brand Identity
  { id: "t_01", projectId: "p_brand", title: "Finalise wordmark spacing and clear space rules", status: "review", priority: "high", assigneeId: "m_sarah", dueDate: "2026-09-16", createdAt: "2026-09-01T09:00:00", updatedAt: "2026-09-12T15:00:00" },
  { id: "t_02", projectId: "p_brand", title: "Present identity round 3 to leadership", status: "todo", priority: "high", assigneeId: "m_alex", dueDate: "2026-09-18", createdAt: "2026-09-02T09:00:00", updatedAt: "2026-09-02T09:00:00" },
  { id: "t_03", projectId: "p_brand", title: "Colour accessibility pass on secondary palette", status: "in-progress", priority: "medium", assigneeId: "m_sarah", dueDate: "2026-09-20", createdAt: "2026-09-03T09:00:00", updatedAt: "2026-09-11T10:00:00" },
  { id: "t_04", projectId: "p_brand", title: "Write brand voice principles", status: "done", priority: "medium", assigneeId: "m_priya", dueDate: "2026-09-05", createdAt: "2026-08-20T09:00:00", updatedAt: "2026-09-04T17:00:00" },
  { id: "t_05", projectId: "p_brand", title: "Shortlist typefaces for body copy", status: "done", priority: "low", assigneeId: "m_sarah", dueDate: "2026-08-28", createdAt: "2026-08-15T09:00:00", updatedAt: "2026-08-27T12:00:00" },
  { id: "t_06", projectId: "p_brand", title: "Art direct studio photography reshoot", status: "done", priority: "medium", assigneeId: "m_lena", dueDate: "2026-09-03", createdAt: "2026-08-22T09:00:00", updatedAt: "2026-09-04T09:30:00" },
  { id: "t_07", projectId: "p_brand", title: "Brand film teaser — colour grade", status: "in-progress", priority: "low", assigneeId: "m_jonas", dueDate: "2026-09-25", createdAt: "2026-09-05T09:00:00", updatedAt: "2026-09-10T09:00:00" },

  // Website Redesign
  { id: "t_08", projectId: "p_web", title: "Homepage hero — pick direction", status: "review", priority: "high", assigneeId: "m_michael", dueDate: "2026-09-15", createdAt: "2026-09-08T09:00:00", updatedAt: "2026-09-14T09:05:00" },
  { id: "t_09", projectId: "p_web", title: "Define responsive grid and spacing tokens", status: "done", priority: "high", assigneeId: "m_michael", dueDate: "2026-08-22", createdAt: "2026-08-10T09:00:00", updatedAt: "2026-08-20T09:00:00" },
  { id: "t_10", projectId: "p_web", title: "Write product story copy for homepage", status: "in-progress", priority: "medium", assigneeId: "m_priya", dueDate: "2026-09-19", createdAt: "2026-09-01T09:00:00", updatedAt: "2026-09-09T14:00:00" },
  { id: "t_11", projectId: "p_web", title: "Navigation transition prototype", status: "done", priority: "low", assigneeId: "m_jonas", dueDate: "2026-08-27", createdAt: "2026-08-18T09:00:00", updatedAt: "2026-08-27T13:35:00" },
  { id: "t_12", projectId: "p_web", title: "Product listing page layouts", status: "todo", priority: "medium", assigneeId: "m_michael", dueDate: "2026-09-26", createdAt: "2026-09-10T09:00:00", updatedAt: "2026-09-10T09:00:00" },
  { id: "t_13", projectId: "p_web", title: "Case study template", status: "todo", priority: "low", dueDate: "2026-10-08", createdAt: "2026-09-10T09:05:00", updatedAt: "2026-09-10T09:05:00" },
  { id: "t_14", projectId: "p_web", title: "Photography brief for product pages", status: "todo", priority: "medium", assigneeId: "m_lena", dueDate: "2026-09-24", createdAt: "2026-09-11T09:00:00", updatedAt: "2026-09-11T09:00:00" },

  // Summer Campaign
  { id: "t_15", projectId: "p_summer", title: "Key visual retouching", status: "done", priority: "high", assigneeId: "m_lena", dueDate: "2026-07-01", createdAt: "2026-06-20T09:00:00", updatedAt: "2026-07-02T10:00:00" },
  { id: "t_16", projectId: "p_summer", title: "OOH artwork to printer", status: "done", priority: "high", assigneeId: "m_sarah", dueDate: "2026-07-11", createdAt: "2026-07-01T09:00:00", updatedAt: "2026-07-10T09:40:00" },
  { id: "t_17", projectId: "p_summer", title: "30s film final delivery", status: "done", priority: "high", assigneeId: "m_jonas", dueDate: "2026-07-15", createdAt: "2026-07-01T09:00:00", updatedAt: "2026-07-14T18:00:00" },
  { id: "t_18", projectId: "p_summer", title: "Campaign wrap report", status: "done", priority: "low", assigneeId: "m_alex", dueDate: "2026-08-18", createdAt: "2026-08-10T09:00:00", updatedAt: "2026-08-18T10:15:00" },

  // Social Launch
  { id: "t_19", projectId: "p_social", title: "Story and feed template system", status: "in-progress", priority: "high", assigneeId: "m_jonas", dueDate: "2026-09-17", createdAt: "2026-08-22T09:00:00", updatedAt: "2026-09-12T17:20:00" },
  { id: "t_20", projectId: "p_social", title: "Launch reel — final cut", status: "in-progress", priority: "high", assigneeId: "m_jonas", dueDate: "2026-09-22", createdAt: "2026-08-25T09:00:00", updatedAt: "2026-09-08T19:30:00" },
  { id: "t_21", projectId: "p_social", title: "Week 1–2 captions", status: "review", priority: "medium", assigneeId: "m_priya", dueDate: "2026-09-16", createdAt: "2026-08-26T09:00:00", updatedAt: "2026-09-05T16:20:00" },
  { id: "t_22", projectId: "p_social", title: "Content calendar sign-off", status: "done", priority: "medium", assigneeId: "m_alex", dueDate: "2026-08-29", createdAt: "2026-08-20T09:00:00", updatedAt: "2026-08-28T11:00:00" },
  { id: "t_23", projectId: "p_social", title: "Profile and cover artwork", status: "todo", priority: "low", assigneeId: "m_sarah", dueDate: "2026-09-30", createdAt: "2026-09-09T09:00:00", updatedAt: "2026-09-09T09:00:00" },

  // Packaging
  { id: "t_24", projectId: "p_pack", title: "Source kraft board samples", status: "in-progress", priority: "medium", assigneeId: "m_sarah", dueDate: "2026-09-23", createdAt: "2026-09-08T13:10:00", updatedAt: "2026-09-09T10:50:00" },
  { id: "t_25", projectId: "p_pack", title: "Dieline for Core box — small", status: "todo", priority: "high", assigneeId: "m_sarah", dueDate: "2026-10-02", createdAt: "2026-09-10T09:00:00", updatedAt: "2026-09-10T09:00:00" },
  { id: "t_26", projectId: "p_pack", title: "Printer quotes — one colour", status: "todo", priority: "low", dueDate: "2026-10-10", createdAt: "2026-09-10T09:05:00", updatedAt: "2026-09-10T09:05:00" },

  // Brand Guidelines
  { id: "t_27", projectId: "p_guide", title: "Photography chapter", status: "in-progress", priority: "medium", assigneeId: "m_lena", dueDate: "2026-09-29", createdAt: "2026-08-20T09:00:00", updatedAt: "2026-09-08T09:00:00" },
  { id: "t_28", projectId: "p_guide", title: "Motion principles chapter", status: "todo", priority: "medium", assigneeId: "m_jonas", dueDate: "2026-10-10", createdAt: "2026-08-20T09:05:00", updatedAt: "2026-08-20T09:05:00" },
  { id: "t_29", projectId: "p_guide", title: "Voice & tone chapter", status: "done", priority: "high", assigneeId: "m_priya", dueDate: "2026-09-03", createdAt: "2026-08-05T09:00:00", updatedAt: "2026-09-03T13:25:00" },
  { id: "t_30", projectId: "p_guide", title: "Logo usage and misuse", status: "done", priority: "high", assigneeId: "m_sarah", dueDate: "2026-08-29", createdAt: "2026-08-05T09:05:00", updatedAt: "2026-08-29T10:00:00" },
  { id: "t_31", projectId: "p_guide", title: "Partner-facing summary (8 pages)", status: "todo", priority: "low", assigneeId: "m_alex", dueDate: "2026-10-24", createdAt: "2026-09-11T09:00:00", updatedAt: "2026-09-11T09:00:00" },
]
