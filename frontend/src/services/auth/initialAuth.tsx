'use client';

import { ReactElement } from "react";
import { useSearchParams } from 'next/navigation';

export function initialAuth(children: ReactElement) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') as string;
    return (
        <div>{children}</div>
    );

}
