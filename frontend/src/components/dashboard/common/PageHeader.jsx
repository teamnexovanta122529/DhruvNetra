export default function PageHeader({
    eyebrow,
    title,
    description,
    status,
}) {
    return (
        <div className="page-header">

            <div>

                <div className="page-eyebrow">
                    {eyebrow}
                </div>

                <h1 className="page-title">
                    {title}
                </h1>

                <p className="page-description">
                    {description}
                </p>

            </div>

            {status && (
                <div className="page-header-status">
                    <i />
                    {status}
                </div>
            )}

        </div>
    );
}