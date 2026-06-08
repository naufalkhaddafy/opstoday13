import React from 'react';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

type FormFieldProps = {
    label: string;
    htmlFor: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    description?: string;
};

export function FormField({ label, htmlFor, required = false, error, children, description }: FormFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            {description && !error && (
                <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
            )}
            <InputError message={error} />
        </div>
    );
}
