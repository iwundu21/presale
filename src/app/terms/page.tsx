
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions',
};

export default function TermsPage() {
    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 prose prose-invert max-w-4xl">
            <h1 className="text-4xl font-bold text-primary mb-4">Terms and Conditions</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 mt-8 text-foreground/90">
                <p>Please read these terms and conditions carefully before using Our Service.</p>

                <h2 className="text-2xl font-semibold text-white">Interpretation and Definitions</h2>
                <h3 className="text-xl font-semibold text-white/90">Interpretation</h3>
                <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
                <h3 className="text-xl font-semibold text-white/90">Definitions</h3>
                <p>For the purposes of these Terms and Conditions:</p>
                <ul>
                    <li><strong>Application</strong> means the software program provided by the Company downloaded by You on any electronic device, named Exnus.</li>
                    <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Exnus Protocol.</li>
                    <li><strong>Service</strong> refers to the Application.</li>
                    <li><strong>Terms and Conditions</strong> (also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li>
                    <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                </ul>

                <h2 className="text-2xl font-semibold text-white">Acknowledgment</h2>
                <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
                <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
                <p>By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.</p>
                <p>Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.</p>

                <h2 className="text-2xl font-semibold text-white">Token Presale</h2>
                <p>The Service includes participation in a presale for EXN tokens. All transactions are final and non-refundable. The Company is not responsible for any losses incurred due to market volatility or user error. You are responsible for the security of your own wallet and private keys.</p>

                <h2 className="text-2xl font-semibold text-white">Limitation of Liability</h2>
                <p>To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of this Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.</p>

                 <h2 className="text-2xl font-semibold text-white">"AS IS" and "AS AVAILABLE" Disclaimer</h2>
                <p>The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice.</p>
                
                <h2 className="text-2xl font-semibold text-white">Changes to These Terms and Conditions</h2>
                <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>

                <h2 className="text-2xl font-semibold text-white">Contact Us</h2>
                <p>If you have any questions about these Terms and Conditions, You can contact us through our official channels.</p>
            </div>
        </main>
    );
}
