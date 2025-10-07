
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface StakingPlanCardProps {
    title: string;
    description: string;
    price: string;
    features: string[];
    isFeatured?: boolean;
    onSelect: () => void;
    tier: 'bronze' | 'silver' | 'gold';
}

const tierStyles = {
    bronze: {
        borderColor: 'border-amber-600/50 dark:border-orange-400/40',
        textColor: 'text-amber-700 dark:text-orange-400',
        iconBg: 'bg-amber-100 dark:bg-orange-900/50',
        buttonClasses: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/40 dark:shadow-orange-900/50 dark:hover:shadow-orange-800/70 transition-all duration-300',
        outlineButtonClasses: 'border border-orange-500 text-orange-500 bg-transparent hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/20 dark:border-orange-600 dark:text-orange-500 dark:hover:bg-orange-600 dark:hover:text-white dark:hover:shadow-lg dark:hover:shadow-orange-600/30 transition-all duration-300'
    },
    silver: {
        borderColor: 'border-slate-400/80 dark:border-slate-500',
        textColor: 'text-slate-600 dark:text-slate-300',
        iconBg: 'bg-slate-200 dark:bg-slate-700/50',
        buttonClasses: 'bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/40 dark:shadow-sky-900/50 dark:hover:shadow-sky-800/70 transition-all duration-300',
        outlineButtonClasses: 'border border-sky-500 text-sky-500 bg-transparent hover:bg-sky-500 hover:text-white hover:shadow-lg hover:shadow-sky-500/20 dark:border-sky-600 dark:text-sky-500 dark:hover:bg-sky-600 dark:hover:text-white dark:hover:shadow-lg dark:hover:shadow-sky-600/30 transition-all duration-300'
    },
    gold: {
        borderColor: 'border-yellow-500/80 dark:border-yellow-400/80',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
        buttonClasses: 'bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-400/50 dark:shadow-amber-900/50 dark:hover:shadow-amber-800/70 transition-all duration-300',
        outlineButtonClasses: 'border border-amber-400 text-amber-400 bg-transparent hover:bg-amber-400 hover:text-black hover:shadow-lg hover:shadow-amber-400/30 dark:border-amber-500 dark:text-amber-500 dark:hover:bg-amber-500 dark:hover:text-black dark:hover:shadow-lg dark:hover:shadow-amber-500/30 transition-all duration-300'
    }
};

export function StakingPlanCard({ title, description, price, features, isFeatured = false, onSelect, tier }: StakingPlanCardProps) {
    const { t } = useTranslation();
    const currentStyle = tierStyles[tier];

    return (
        <Card className={cn(
            'flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2', 
            isFeatured ? `border-2 shadow-primary/20 ${currentStyle.borderColor}` : `border shadow-lg ${currentStyle.borderColor}`
        )}>
            <CardHeader className="items-center text-center gap-2 pt-6">
                <div className={cn(
                    'mb-2 flex h-16 w-16 items-center justify-center rounded-full',
                    isFeatured ? 'bg-primary/10 dark:bg-primary/20' : currentStyle.iconBg
                )}>
                    <Medal className={cn('w-8 h-8', currentStyle.textColor)} />
                </div>
                <CardTitle className={cn('font-headline text-2xl', currentStyle.textColor)}>{title}</CardTitle>
                <p className="text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="flex-grow pt-4">
                <div className="text-center mb-6">
                    <span className="text-4xl font-bold">{price}</span>
                    <span className="text-muted-foreground"> / RYC</span>
                </div>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start rtl:flex-row-reverse">
                            <Check className="w-5 h-5 shrink-0 text-green-500 me-3 mt-1" />
                            <span className="text-foreground/80 text-start">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                 <Button 
                  onClick={onSelect} 
                  className={cn(
                      'w-full font-bold', 
                      isFeatured ? currentStyle.buttonClasses : currentStyle.outlineButtonClasses
                  )}
                >
                    {t('role_selection.select_plan')}
                </Button>
            </CardFooter>
        </Card>
    );
}
