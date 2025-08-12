import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent":
      return "text-red-600 bg-red-50 border-red-200";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "todo":
      return "bg-gray-100 text-gray-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "in-review":
      return "bg-yellow-100 text-yellow-800";
    case "done":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "todo":
      return "To Do";
    case "in-progress":
      return "In Progress";
    case "in-review":
      return "In Review";
    case "done":
      return "Done";
    default:
      return status;
  }
}
