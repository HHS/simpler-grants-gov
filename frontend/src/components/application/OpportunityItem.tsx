export const OpportunityItem = ({opKey, opValue}: {opKey: string, opValue?: string | null}) => {
    return (
        <div>
            <dt className="margin-right-1 text-bold">{ opKey }:</dt>
            <dd>{ opValue ?? '--'}</dd>
        </div>
    )
}