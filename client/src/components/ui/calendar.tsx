import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "../../lib/utils"
import "react-day-picker/dist/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-2", className)}
      classNames={{
        caption_label: "text-sm font-medium",
        nav_button: "h-7 w-7 bg-transparent hover:bg-gray-100 rounded",
        day: "h-9 w-9 p-0 font-normal rounded hover:bg-gray-100",
        day_selected: "bg-blue-600 text-white hover:bg-blue-600",
        day_today: "border border-blue-300",
      }}
      {...props}
    />
  )
}


