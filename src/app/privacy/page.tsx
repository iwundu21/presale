
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
};

export default function PrivacyPage() {
    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 prose prose-invert max-w-4xl">
            <h1 className="text-4xl font-bold text-primary mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-6 mt-8 text-foreground/90">
                <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>

                <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
                <p>We may collect certain information automatically when You use our Service, including:</p>
                <ul>
                    <li><strong>Wallet Information:</strong> We collect your public wallet address when you connect to our Service. We do not collect or store your private keys.</li>
                    <li><strong>Transaction Data:</strong> We may collect public data related to your transactions on the Solana blockchain, such as transaction IDs, amounts, and timestamps, as it pertains to your interaction with our presale contract. This data, along with your token balance, is stored in our secure Firebase Firestore database.</li>
                    <li><strong>Usage Data:</strong> We may collect information about how you access and use the Service for analytics purposes to improve user experience.</li>
                </ul>

                <h2 className="text-2xl font-semibold text-white">How We Use Your Information</h2>
                <p>We use the information we collect for various purposes, including:</p>
                <ul>
                    <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
                    <li>To manage Your participation in the token presale, including tracking your contributions and calculating your token balance.</li>
                    <li>To communicate with You about the Service, including updates and announcements.</li>
                    <li>For data analysis, identifying usage trends, and to evaluate and improve our Service.</li>
                </ul>

                <h2 className="text-2xl font-semibold text-white">Data Security</h2>
                <p>The security of Your data is important to Us. We use Firebase Firestore to securely store user and transaction data. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security as no method of transmission over the Internet, or method of electronic storage is 100% secure. All blockchain transactions are public by nature.</p>

                <h2 className="text-2xl font-semibold text-white">Third-Party Services</h2>
                <p>Our Service may use third-party services, such as wallet providers (e.g., Phantom, Solflare) and blockchain explorers (e.g., Solscan). We do not control and are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.</p>
                
                <h2 className="text-2xl font-semibold text-white">Changes to this Privacy Policy</h2>
                <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</p>
                
                <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, You can contact us through our official channels.</p>
            </div>
        </main>
    );
}
