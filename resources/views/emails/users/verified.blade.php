<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview</title>
    <!-- CSS di dalam head masih berguna untuk Apple Mail, Gmail, dan mobile client -->
    <style>
        body {
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        p {
            display: block;
            margin: 13px 0;
        }
        /* Mobile responsive adjustments */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .content-padding {
                padding: 20px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #edf2f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #edf2f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!--[if mso | IE]>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width:600px;">
                <tr>
                <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                <![endif]-->

                <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td class="content-padding" style="padding: 32px;">
                            
                            <!-- Logo -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <img src="{{ asset('icon/b-hero-icon.png') }}" alt="b-hero Logo" width="70" style="display: block; max-height: 70px; width: auto; border-radius: 4px;">
                                    </td>
                                </tr>
                            </table>

                            <!-- Title -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <h1 style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">Account Successfully Verified</h1>
                                    </td>
                                </tr>
                            </table>

                            <!-- Body Text -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #334155; font-size: 16px; line-height: 1.5; padding-bottom: 20px;">
                                        Hello <strong>{{ $user->name }}</strong>,
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #334155; font-size: 16px; line-height: 1.5; padding-bottom: 25px;">
                                        Good news! Your account has been successfully verified by <strong>{{ $verifier->name }}</strong>. You can now access all the features of the system.
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <!-- Card Title -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                                                    <h3 style="margin: 0; color: #334155; font-size: 16px;">Your Verified Information</h3>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Card Data -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #475569;"><strong>Employee ID</strong></td>
                                                <td align="right" style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 500;">{{ $user->employee_id }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #475569;"><strong>Company</strong></td>
                                                <td align="right" style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 500;">{{ $user->company?->name ?? '-' }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #475569;"><strong>Role</strong></td>
                                                <td align="right" style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 500;">{{ $user->getRoleNames()->first() ?? '-' }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Button (Outlook Safe) -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-top: 30px; padding-bottom: 30px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#10b981" style="border-radius: 4px;">
                                                    <a href="{{ config('app.url') }}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; border: 1px solid #10b981; border-radius: 4px;">Login to Your Account</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Footer -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #718096; font-size: 14px; line-height: 1.5;">
                                        Best Regards,<br><strong style="color: #475569;">{{ config('app.name', 'B-Hero Platform') }}</strong>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

                <!--[if mso | IE]>
                </td>
                </tr>
                </table>
                <![endif]-->

            </td>
        </tr>
    </table>

</body>
</html>
