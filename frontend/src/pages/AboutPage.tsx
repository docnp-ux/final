function AboutPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6 py-10">
            <h1 className="text-3xl font-bold">About</h1>

            <p className="text-muted-foreground">
                The Solar Tracker App is developed for monitoring and controlling Esp32 operated
                solar panel with x-y axis tracking using servos and LDRs.
            </p>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">How it works</h2>
                <p className="text-muted-foreground">
                    The Esp32 reads the values from the 4 LDR, calculates their average values
                    locally and sends them to the backend every 5 minutes.
                    The user can see the power generated from the device, whereas the admin
                    can access technical data as current, voltage, servo positions, etc.
                    as well as override their current position.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">Tech stack</h2>
                <ul className="list-inside list-disc text-muted-foreground">
                    <li>Backend: FastAPI, SQLModel, PostgreSQL</li>
                    <li>Frontend: React, TypeScript, Vite, Tailwind CSS</li>
                    <li>Firmware: ESP32-S3 (Arduino/C++)</li>
                    <li>Deployment: Docker Compose</li>
                </ul>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-semibold">Author</h2>
                <p className="text-muted-foreground">
                    Iatrou Nikolaos — AUEB Coding Factory 9, 2026.
                </p>
            </section>
        </div>
    )
}

export default AboutPage