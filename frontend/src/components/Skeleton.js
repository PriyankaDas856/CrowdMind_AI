/**
 * Premium skeleton primitives — shimmer animation defined in index.css (.cm-skeleton)
 */

export function Skeleton({ className = "", ...rest }) {
    return (
        <div
            className={`cm-skeleton rounded-lg ${className}`}
            aria-hidden="true"
            {...rest}
        />
    );
}

export function SkeletonText({ lines = 3, className = "" }) {
    return (
        <div className={`space-y-2 ${className}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="cm-skeleton h-3 rounded-md"
                    style={{
                        width: i === lines - 1 ? "62%" : "100%",
                    }}
                />
            ))}
        </div>
    );
}

export function SkeletonStatCard({ testId }) {
    return (
        <div
            className="cm-card rounded-2xl p-5"
            data-testid={testId}
            aria-busy="true"
        >
            <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="w-9 h-9 rounded-lg" />
            </div>
            <Skeleton className="mt-5 h-10 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
        </div>
    );
}

export function SkeletonProjectCard({ testId }) {
    return (
        <div
            className="cm-card rounded-2xl p-5"
            data-testid={testId}
            aria-busy="true"
        >
            <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-6 w-3/4" />
            <SkeletonText lines={3} className="mt-3" />
            <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonHealthScore({ testId }) {
    return (
        <div
            className="cm-card rounded-3xl p-7"
            data-testid={testId}
            aria-busy="true"
        >
            <div className="flex flex-col md:flex-row items-center gap-7">
                <Skeleton className="w-36 h-36 rounded-full" />
                <div className="flex-1 w-full space-y-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-7 w-3/4" />
                    <SkeletonText lines={2} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-6 w-12" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
