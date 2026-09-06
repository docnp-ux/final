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
                    Ο ESP32-S3 διαβάζει 4 αισθητήρες LDR, υπολογίζει τον μέσο όρο τοπικά και
                    στέλνει τις μετρήσεις στο backend κάθε 5 λεπτά. Ο admin βλέπει ζωντανά
                    δεδομένα, ιστορικά γραφήματα και μπορεί να ελέγξει χειροκίνητα τα servo.
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
                    Ιατρου Νικόλαος — AUEB Coding Factory 9, 2026.
                </p>
            </section>
        </div>
    )
}

export default AboutPage