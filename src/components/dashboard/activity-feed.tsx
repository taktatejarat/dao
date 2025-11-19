// src/components/dashboard/activity-feed.tsx (نسخه اصلاح شده)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/hooks/use-translation";
import { useActivityFeed } from "@/hooks/useActivityFeed"; // ✅ هوک جدید
import { DaoLoadingSpinner } from "../icons/dao-loading-spinner";
import { formatDistanceToNow } from 'date-fns'; // برای نمایش زمان نسبی

export function ActivityFeed() {
    const { t } = useTranslation();
    const { activities, isLoading, error } = useActivityFeed();

    const generateAvatarFallback = (user: string) => {
        if (user.startsWith('0x')) return user.substring(2, 4).toUpperCase();
        return user.substring(0, 2).toUpperCase();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{t('dashboard.recent_activities')}</CardTitle>
                <CardDescription>{t('dashboard.recent_activities_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-4"><DaoLoadingSpinner /></div>
                ) : error ? (
                    <p className="text-destructive text-center">{error}</p>
                ) : activities.length === 0 ? (
                    <p className="text-muted-foreground text-center">{t('dashboard.no_activities_found')}</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4">
                            <Avatar>
                                <AvatarFallback>{generateAvatarFallback(activity.user)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm">
                                   <span className="font-semibold">{activity.user}</span> {activity.action}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(activity.timestamp * 1000), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}