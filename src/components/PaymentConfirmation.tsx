import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, AlertCircle, Clock, Home, ArrowLeft } from 'lucide-react';
import { teamsService, registrationsService } from '../services/databaseService';
import type { Registration } from '../services/databaseService';

interface VerificationResponse {
  success: boolean;
  message: string;
  data?: {
    teamId: number;
    teamName?: string;
    domain?: string;
    memberCount: number;
    registrationDate?: string;
    paymentStatus?: string;
  };
  error?: string;
}

const PaymentConfirmation: React.FC = () => {
  const navigate = useNavigate();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'failed' | 'pending'>('loading');
  const [verificationData, setVerificationData] = useState<VerificationResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        // Get team ID from sessionStorage
        const teamIdStr = sessionStorage.getItem('registrationTeamId');
        const teamName = sessionStorage.getItem('registrationTeamName');
        const domain = sessionStorage.getItem('registrationDomain');
        const membersJson = sessionStorage.getItem('registrationMembers');

        if (!teamIdStr) {
          setVerificationStatus('failed');
          setErrorMessage('No registration found. Please start the registration process again.');
          return;
        }

        const teamId = parseInt(teamIdStr);

        console.log('Fetching payment data for team:', teamId);

        // Fetch team details from Supabase
        const { data: teamData, error: teamError } = await teamsService.getTeamById(teamId);

        if (teamError || !teamData) {
          console.error('Error fetching team:', teamError);
          setVerificationStatus('failed');
          setErrorMessage('Failed to fetch team details. Please try again.');
          return;
        }

        // Fetch team registrations
        const { data: registrationData, error: regError } = await registrationsService.getTeamRegistrations(teamId);

        if (regError) {
          console.error('Error fetching registrations:', regError);
          setVerificationStatus('failed');
          setErrorMessage('Failed to fetch registration details.');
          return;
        }

        console.log('Team data:', teamData);
        console.log('Registration data:', registrationData);

        // Check payment status
        if (teamData.payment_status === 'Completed' && teamData.razorpay_payment_id) {
          // Payment verified
          setVerificationStatus('verified');
          setVerificationData({
            teamId: teamData.id,
            teamName: teamData.team_name,
            domain: teamData.domain,
            memberCount: teamData.team_size,
            registrationDate: teamData.created_at,
            paymentStatus: teamData.payment_status
          });
          setRegistrations(registrationData || []);
          
          // Clear sessionStorage after successful verification
          sessionStorage.removeItem('registrationTeamId');
          sessionStorage.removeItem('registrationTeamName');
          sessionStorage.removeItem('registrationDomain');
          sessionStorage.removeItem('registrationMembers');
        } else if (teamData.payment_status === 'Pending' || teamData.payment_status === 'Initiated') {
          // Payment still pending
          setVerificationStatus('pending');
          setErrorMessage('Payment is still being processed. Please wait or try refreshing the page.');
        } else if (teamData.payment_status === 'Failed' || teamData.payment_status === 'Refunded') {
          // Payment failed
          setVerificationStatus('failed');
          setErrorMessage(`Payment ${teamData.payment_status.toLowerCase()}. Please try registering again.`);
        } else {
          // Unknown status
          setVerificationStatus('failed');
          setErrorMessage('Unable to determine payment status. Please contact support.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('failed');
        setErrorMessage('An unexpected error occurred. Please contact support.');
      }
    };

    fetchPaymentData();
  }, []);

  // Success state
  if (verificationStatus === 'verified' && verificationData) {
    return (
      <div className="min-h-screen bg-black py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/20 to-black pointer-events-none"></div>
        <div className="hidden lg:block absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-lg pointer-events-none"></div>
        <div className="hidden 2xl:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/3 rounded-full blur-lg pointer-events-none"></div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>

          <Card className="bg-white/[0.02] backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-500 hover:bg-white/[0.05] hover:border-white/20 hover:shadow-2xl hover:shadow-white/10 shadow-2xl relative overflow-hidden">
            {/* Liquid Glass Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.03] pointer-events-none rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <CardHeader className="text-center mb-8 sm:mb-12 relative z-10">
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full border border-green-500/30 backdrop-blur-sm">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
                Registration Confirmed!
              </CardTitle>
              <CardDescription className="text-gray-300 text-base sm:text-lg">
                Your payment has been successfully verified
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 space-y-8">
              {/* Success Message */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <p className="text-green-200 text-sm sm:text-base font-medium">
                  ✓ Your team has been successfully registered for ZIGNASA 2K25. A confirmation email will be sent shortly.
                </p>
              </div>

              {/* Registration Details */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-white font-semibold text-lg sm:text-xl mb-4 sm:mb-6">Registration Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Team Name</p>
                    <p className="text-white text-sm sm:text-base font-semibold break-words">
                      {verificationData?.teamName || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Domain</p>
                    <p className="text-white text-sm sm:text-base font-semibold break-words">
                      {verificationData?.domain || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Team Members</p>
                    <p className="text-white text-sm sm:text-base font-semibold">
                      {verificationData?.memberCount || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Payment Status</p>
                    <p className="text-white text-sm sm:text-base font-semibold">
                      {verificationData?.paymentStatus || 'Verified'}
                    </p>
                  </div>

                  <div className="bg-white/[0.03] backdrop-blur-lg border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">Registration Date</p>
                    <p className="text-white text-sm sm:text-base font-semibold">
                      {verificationData?.registrationDate ? new Date(verificationData.registrationDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <p className="text-blue-200 text-xs sm:text-sm">
                  <span className="font-semibold">Note:</span> Please keep your Team ID and Payment ID safe. You'll need them for future reference and inquiries regarding your registration.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                <Link 
                  to="/"
                  className="flex-1"
                >
                  <Button className="w-full bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white font-semibold py-3 sm:py-4 px-8 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-white/20 backdrop-blur-lg border border-white/20 text-sm sm:text-base h-10 sm:h-12">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending/Loading state
  if (verificationStatus === 'loading' || verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-black py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/20 to-black pointer-events-none"></div>

        <div className="max-w-2xl mx-auto relative z-10">
          <Card className="bg-white/[0.02] backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.03] pointer-events-none rounded-3xl"></div>

            <CardHeader className="text-center mb-8 sm:mb-12 relative z-10">
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 bg-gradient-to-br from-yellow-500/20 to-amber-600/10 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 animate-spin" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
                Verifying Payment...
              </CardTitle>
              <CardDescription className="text-gray-300 text-base sm:text-lg">
                Please wait while we verify your payment
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 text-center">
              <p className="text-gray-400 text-sm sm:text-base">
                This usually takes a few seconds. Do not refresh the page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Failed state
  if (verificationStatus === 'failed') {
    return (
      <div className="min-h-screen bg-black py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/20 to-black pointer-events-none"></div>

        <div className="max-w-2xl mx-auto relative z-10">
          <Card className="bg-white/[0.02] backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.03] pointer-events-none rounded-3xl"></div>

            <CardHeader className="text-center mb-8 sm:mb-12 relative z-10">
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="p-4 sm:p-6 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-full border border-red-500/30 backdrop-blur-sm">
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
                Verification Failed
              </CardTitle>
              <CardDescription className="text-gray-300 text-base sm:text-lg">
                We couldn't verify your payment
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6 sm:space-y-8">
              {/* Error Message */}
              <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <p className="text-red-200 text-sm sm:text-base">
                  {errorMessage}
                </p>
              </div>

              {/* Support Instructions */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <h4 className="text-purple-200 font-semibold text-sm sm:text-base mb-2">What to do next?</h4>
                <ul className="text-purple-200 text-xs sm:text-sm space-y-2 list-disc list-inside">
                  <li>Contact support with your Team ID and provide payment details</li>
                  <li>Our team will assist you in resolving the payment issue</li>
                  <li>Try registering again with a different payment method</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                <Link 
                  to="/"
                  className="flex-1"
                >
                  <Button className="w-full bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white font-semibold py-3 sm:py-4 px-8 rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-white/20 backdrop-blur-lg border border-white/20 text-sm sm:text-base h-10 sm:h-12">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentConfirmation;
