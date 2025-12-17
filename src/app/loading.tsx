// src/app/loading.tsx

import { DaoLoadingSpinner } from "@/components/icons/dao-loading-spinner";

export default function Loading() {
    return (
        <DaoLoadingSpinner 
            size="fullscreen" 
            variant="blockchain" 
            showText={true} 
        />
    );
}