
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoadingSkeleton() {
    return (
      <div className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
      </div>
    )
}
