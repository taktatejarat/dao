import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/hooks/use-translation";

export function ActivityFeed() {
  const { t } = useTranslation();
  
  const activities = [
      {
          id: 'act1',
          user: t('users.user1'),
          actionKey: "activities.voted_positive",
          proposalKey: "proposals.network_upgrade",
          timeKey: "time.minutes_ago",
          avatar: "https://placehold.co/40x40.png?text=U1",
          avatarFallback: t('users.user1').substring(0, 2)
      },
      {
          id: 'act2',
          user: t('users.you'),
          actionKey: "activities.transferred_tokens",
          proposalKey: "",
          timeKey: "time.hour_ago",
          avatar: "https://placehold.co/40x40.png?text=Y",
          avatarFallback: t('users.you').substring(0, 1)
      },
      {
          id: 'act3',
          user: t('users.user3'),
          actionKey: "activities.created_proposal",
          proposalKey: "proposals.marketing_project",
          timeKey: "time.hours_ago",
          avatar: "https://placehold.co/40x40.png?text=U3",
          avatarFallback: t('users.user3').substring(0, 2)
      },
      {
          id: 'act4',
          user: t('users.user4'),
          actionKey: "activities.voted_negative",
          proposalKey: "proposals.mobile_dapp",
          timeKey: "time.yesterday",
          avatar: "https://placehold.co/40x40.png?text=U4",
          avatarFallback: t('users.user4').substring(0, 2)
      },
  ];

  const formatAction = (actionKey: string, proposalKey: string) => {
    let actionText = t(actionKey);
    if (proposalKey) {
      actionText = actionText.replace('{proposal}', `"${t(proposalKey)}"`);
    }
    return actionText;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('dashboard.recent_activities')}</CardTitle>
        <CardDescription>{t('dashboard.recent_activities_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
             <div key={activity.id} className="flex items-start gap-4">
                <Avatar>
                    <AvatarImage src={activity.avatar} data-ai-hint="person" />
                    <AvatarFallback>{activity.avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="text-sm">
                       <span className="font-semibold">{activity.user}</span> {formatAction(activity.actionKey, activity.proposalKey)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(activity.timeKey)}</p>
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
