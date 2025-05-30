export const OpportunityItem = ({opKey, opValue}: {opKey: string, opValue?: string | null}) => {
    return (
        <div>
            <dt>{ opKey }:</dt>
            <dd>{ opValue ?? '--'}</dd>
        </div>
    )
}