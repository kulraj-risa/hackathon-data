import { Toast } from "risa-oasis-ui_v2";

const Toasts = () => {
  return (
    <>
      <Toast
        type={"error"}
        header={"Something went wrong!"}
        id={"rerun-error"}
      />
      <Toast
        type={"success"}
        header={"Re-run successful!"}
        id={"rerun-success"}
      />
      <Toast
        header="Coverage refreshed successfully!"
        type="success"
        id="coverage-refresh-success"
      />
      <Toast
        header="Coverage refreshing failed!"
        type="error"
        id="coverage-refresh-failure"
      />
      <Toast
        header="Patient Responsibility calculated!"
        type="success"
        id="pr-success"
      />
      <Toast
        header="Patient Responsibility calculation failed!"
        type="error"
        id="pr-failure"
      />
      <Toast
        header="Insurance details saved successfully!"
        type="success"
        id="cmm-insurance-save-success"
      />
      <Toast
        header="Insurance details save failed!"
        type="error"
        id="cmm-insurance-save-failure"
      />
      <Toast
        header="Form Details saved successfully!"
        type="success"
        id="form-save-success"
      />
      <Toast
        header="Form Details save failed!"
        type="error"
        id="form-save-failure"
      />
      <Toast
        header="Submission initiated!"
        type="success"
        id="submission-initiated-success"
      />
      <Toast
        header="Submission initiation failed!"
        type="error"
        id="submission-initiated-failed"
      />
      <Toast
        header="Copied to clipboard"
        type="success"
        id="key-copy-success"
      />
      <Toast
        header="Status updated successfully!"
        type="success"
        id="status-changed-success"
      />
      <Toast
        header="Status update failed!"
        type="error"
        id="status-changed-failure"
      />
      <Toast
        header="Assignee updated successfully!"
        type="success"
        id="assignee-changed-success"
      />
      <Toast
        header="Assignee update failed!"
        type="error"
        id="assignee-changed-failure"
      />
      <Toast
        header="Cannot upload duplicate file!"
        type="error"
        id="duplicate-file-upload"
      />
      <Toast
        header="Send to plan successful!"
        type="success"
        id="send-to-plan-success"
      />
      <Toast
        header="Unable to check eligibility!"
        type="error"
        id="check-eligibility-failure"
      />
      <Toast
        header="Claims processing failed!"
        type="error"
        id="check-claims-failure"
      />
      <Toast
        header="Eligibility checked successfully!"
        type="success"
        id="check-eligibility-success"
      />
      <Toast
        header="Claims processed successfully!"
        type="success"
        id="check-claims-success"
      />
      <Toast
        header="Please verify your email before logging in. A new verification email has been sent."
        type="error"
        id="email-verification-failed"
      />
      <Toast
        type={"error"}
        header={"Email or password is incorrect. Please try again."}
        id={"invalid-email-or-password"}
      />
      <Toast
        type={"success"}
        header={"Password reset link sent to your email"}
        id={"email_sent"}
      />
      <Toast
        type={"error"}
        header={"Could not send the email. Please try resending"}
        id={"email_sent_error"}
      />
      <Toast
        type={"error"}
        header={"Failed to sign up. Please try again."}
        id={"sign_up_error"}
      />
      <Toast
        type={"error"}
        header={"Failed to login. Please try again."}
        id={"login_error"}
      />
      <Toast
        type={"error"}
        header={"Error setting up MFA. Please try again."}
        id={"mfa_setup_error"}
      />
      <Toast
        type={"success"}
        header={"MFA setup successfully for the user!"}
        id={"mfa_setup_success"}
      />
      <Toast
        type={"success"}
        header={"MFA verification successful!"}
        id={"mfa_success"}
      />
      <Toast
        type={"error"}
        header={"MFA verification failed. Please try again."}
        id={"mfa_verification_error"}
      />
      <Toast
        header="Please verify your email before logging in. A new verification email has been sent."
        type="success"
        id="email-verification-success"
      />
      <Toast
        type={"success"}
        header={"Re-running eligibility check."}
        id={"re-running-eligibility-check"}
      />
      <Toast
        type={"success"}
        header={"Case Re-run Successful"}
        id={"re-run-success-onco-emr"}
      />
      <Toast
        type={"success"}
        header={"Case Re-run Successful"}
        id={"re-run-success-cmm"}
      />
      <Toast
        type={"error"}
        header={"Error saving form details. Please try again."}
        id={"form-save-failure"}
      />
      <Toast
        type={"success"}
        header={"Form details saved successfully!"}
        id={"form-save-success"}
      />
      <Toast
        type={"success"}
        header={"Inaccuracy Reported Successfully!"}
        id={"inaccuracy-reported-success"}
      />
      <Toast
        type={"error"}
        header={"Error reporting inaccuracy. Please try again."}
        id={"inaccuracy-reported-failure"}
      />
      <Toast
        type={"success"}
        header={"Evbv Status Updated Successfully!"}
        id={"evbv-status-updated-success"}
      />
      <Toast
        type={"error"}
        header={"Error updating evbv status. Please try again."}
        id={"evbv-status-updated-failure"}
      />
      <Toast
        type={"success"}
        header={"Auth on file refresh initiated!"}
        id={"auth-on-file-refreshed-success"}
      />
      <Toast
        type={"error"}
        header={"Error refreshing auth on file. Please try again."}
        id={"auth-on-file-refreshed-failure"}
      />
      <Toast
        type={"success"}
        header={"Password updated successfully!"}
        id={"password_reset_success"}
      />
      <Toast
        type={"error"}
        header={"Error in updating password."}
        id={"password_reset_failure"}
      />
      <Toast
        type={"success"}
        header={"Validator run initiated!"}
        id={"validator-run-initiated"}
      />
      <Toast
        type={"error"}
        header={"Error in initiating validator run."}
        id={"validator-run-initiated-failure"}
      />
      <Toast
        type={"success"}
        header={"SIG box note update initiated successfully!"}
        id={"cig-box-note-updated-success"}
      />
      <Toast
        type={"error"}
        header={"Error in updating SIG box note."}
        id={"cig-box-note-updated-failure"}
      />
      <Toast
        type={"success"}
        header={"Version deployed successfully!"}
        id={"version-deploy-success"}
      />
      <Toast
        type={"error"}
        header={"Could not deploy version. Please try again."}
        id={"version-deploy-error"}
      />
      <Toast
        type={"error"}
        header={"Error in submitting form. Please try again."}
        id={"form-submission-failure"}
      />
      <Toast
        type={"success"}
        header={"Form submission initiated!"}
        id={"form-submission-success"}
      />
      <Toast
        type={"error"}
        header={"Error saving form config. Please try again."}
        id={"form-config-save-failure"}
      />
      <Toast
        type={"success"}
        header={"Form config saved successfully!"}
        id={"form-config-save-success"}
      />
      <Toast
        type={"success"}
        header={"Form configuration updated successfully!"}
        id={"form-configuration-update-success"}
      />
      <Toast
        type={"error"}
        header={"Error updating form configuration. Please try again."}
        id={"form-configuration-update-failure"}
      />
      <Toast
        type={"success"}
        header={"Sent to plan configuration updated successfully!"}
        id={"sent-to-plan-configuration-update-success"}
      />
      <Toast
        type={"error"}
        header={"Error updating sent to plan configuration. Please try again."}
        id={"sent-to-plan-configuration-update-failure"}
      />
      <Toast
        type={"success"}
        header={"PBM configuration saved successfully!"}
        id={"pbm-config-save-success"}
      />
      <Toast
        type={"error"}
        header={"Error saving PBM configuration. Please try again."}
        id={"pbm-config-save-error"}
      />
      <Toast
        type={"error"}
        header={"Drug already exists!"}
        id={"drug-name-already-exists"}
      />
      <Toast
        type={"success"}
        header={"New Drug added successfully!"}
        id={"drug-name-added-successfully"}
      />
      <Toast
        type={"error"}
        header={"Error adding drug name. Please try again."}
        id={"drug-name-add-failure"}
      />
      <Toast
        type={"success"}
        header={"Parsed insurance card saved successfully!"}
        id={"parsed-insurance-card-save-success"}
      />
      <Toast
        type={"error"}
        header={"Error saving parsed insurance card. Please try again."}
        id={"parsed-insurance-card-save-failure"}
      />
      <Toast
        type={"success"}
        header={"Credential saved successfully!"}
        id={"credential_save_success"}
      />
      <Toast
        type={"error"}
        header={"Error saving credential. Please try again."}
        id={"credential_save_error"}
      />
      <Toast
        type={"success"}
        header={"Invitation sent successfully!"}
        id={"invitation-success"}
      />
      <Toast
        type={"success"}
        header={"Medicine name configuration deployed successfully!"}
        id={"medicine-name-deploy-success"}
      />
      <Toast
        type={"error"}
        header={
          "Error deploying medicine name configuration. Please try again."
        }
        id={"medicine-name-deploy-error"}
      />
      <Toast
        type={"error"}
        header={"Please select a version to deploy."}
        id={"medicine-name-deploy-no-version"}
      />
      <Toast
        type={"error"}
        header={"Please enter MRN to test."}
        id={"medicine-name-test-no-mrn"}
      />
      <Toast
        type={"error"}
        header={"Please enter identifier to test."}
        id={"medicine-name-test-no-identifier"}
      />
      <Toast
        type={"error"}
        header={"Please enter medicine options to test."}
        id={"medicine-name-test-no-options"}
      />
      <Toast
        type={"error"}
        header={"Please select a version for testing."}
        id={"medicine-name-test-no-version"}
      />
      <Toast
        type={"success"}
        header={"Medicine name configuration tested successfully!"}
        id={"medicine-name-test-success"}
      />
      <Toast
        type={"error"}
        header={"Error testing medicine name configuration. Please try again."}
        id={"medicine-name-test-error"}
      />
      <Toast
        type={"success"}
        header={"Medicine name configuration refreshed successfully!"}
        id={"medicine-name-config-refreshed"}
      />
      <Toast
        type={"error"}
        header={
          "Error refreshing medicine name configuration. Please try again."
        }
        id={"medicine-name-config-refresh-error"}
      />
      <Toast
        type={"success"}
        header={"Medicine name configuration version saved successfully!"}
        id={"medicine-name-config-version-saved"}
      />
      <Toast
        type={"error"}
        header={
          "Error saving medicine name configuration version. Please try again."
        }
        id={"medicine-name-config-save-error"}
      />
      <Toast
        type={"error"}
        header={"Error sending invitation. Please try again."}
        id={"invitation-failure"}
      />
      <Toast
        type={"success"}
        header={"Facility added successfully!"}
        id={"facility-added-success"}
      />
      <Toast
        type={"error"}
        header={"Error adding facility. Please try again."}
        id={"facility-added-failure"}
      />
      <Toast
        type={"success"}
        header={"ICD code determined successfully!"}
        id={"icd-code-determination-success"}
      />
      <Toast
        type={"error"}
        header={"Error determining ICD code. Please try again."}
        id={"icd-code-determination-failure"}
      />
      <Toast
        type={"success"}
        header={"ICD instructions updated successfully!"}
        id={"icd-instructions-updated-successfully"}
      />
      <Toast
        type={"success"}
        header={"Excel file exported successfully!"}
        id={"excel-exported-successfully"}
      />
      <Toast
        type={"error"}
        header={"Please select a date first"}
        id={"please-select-a-date"}
      />
      <Toast
        type={"error"}
        header={"No diff data available"}
        id={"no-diff-data-available"}
      />
      <Toast
        type={"success"}
        header={"Clinical attachment refetched successfully"}
        id={"clinical-attachment-refetched-successfully"}
      />
      <Toast
        type={"error"}
        header={"Error refetching clinical attachment. Please try again."}
        id={"clinical-attachment-refetched-failure"}
      />
      <Toast
        type={"error"}
        header={"No diff data available for selected date"}
        id={"no-diff-data-available-for-selected-date"}
      />
      <Toast
        type={"success"}
        header={"CSV processing initiated successfully!"}
        id={"csv-processing-success"}
      />
      <Toast
        type={"error"}
        header={"Error processing CSV. Please try again."}
        id={"csv-processing-failure"}
      />
      <Toast
        type={"success"}
        header={"File uploaded successfully!"}
        id={"final-worklist-upload-success"}
      />
      <Toast
        type={"error"}
        header={"Error uploading file. Please try again."}
        id={"final-worklist-upload-failure"}
      />
      <Toast
        type={"error"}
        header={"Error fetching analytics data. Please try again."}
        id={"error-analytics"}
      />
      <Toast
        header="Link sent via email successfully!"
        type="success"
        id="email-sent-success"
      />
      <Toast
        type={"error"}
        header={"Error sending link via email. Please try again."}
        id={"email-sent-failure"}
      />
      <Toast
        type={"success"}
        header={"CPT codes updated successfully!"}
        id={"cpt-codes-updated-successfully"}
      />
      <Toast
        type={"error"}
        header={"Error updating CPT codes. Please try again."}
        id={"cpt-codes-updated-failure"}
      />
      <Toast
        type={"success"}
        header={"Related drugs Updated successfully!"}
        id={"related-drugs-added-successfully"}
      />
      <Toast
        type={"success"}
        header={"Fetching PDF. Please come back after a few minutes"}
        id={"refresh-pdf-success"}
      />
      <Toast
        type={"error"}
        header={"Error refreshing PDF. Please try again."}
        id={"refresh-pdf-failure"}
      />
      <Toast
        type={"success"}
        header={"Order assigned successfully!"}
        id={"assign-order-success"}
      />
      <Toast
        type={"error"}
        header={"Error assigning order. Please try again."}
        id={"assign-order-failed"}
      />
      <Toast
        type={"success"}
        header={"Orders pushed successfully!"}
        id={"order-pushed-success"}
      />
      <Toast
        type={"error"}
        header={"Error pushing orders. Please try again."}
        id={"order-pushed-failure"}
      />
      <Toast
        type={"success"}
        header={"Availity payer ID check completed successfully"}
        id={"payer-id-check-success"}
      />
      <Toast
        type={"error"}
        header={"Availity payer ID check failed"}
        id={"payer-id-check-failed"}
      />
      <Toast
        type={"error"}
        header={"Please enter a drug name"}
        id={"drug-name-error"}
      />
      <Toast
        type={"error"}
        header={"Error fetching drug label. Please try again."}
        id={"drug-label-error"}
      />
      <Toast
        type={"success"}
        header={"Drug label fetched successfully"}
        id={"drug-label-success"}
      />
      <Toast
        type={"success"}
        header={"Document uploaded successfully"}
        id={"nar-letter-uploaded"}
      />
      <Toast
        type={"success"}
        header={"Mark as completed trial updated successfully"}
        id={"mark-as-completed-trial-updated"}
      />
      <Toast
        type={"error"}
        header={"Error updating mark as completed trial. Please try again."}
        id={"mark-as-completed-trial-updated-error"}
      />
      <Toast
        type={"success"}
        header={"Status update successful"}
        id={"status-update-success"}
      />
      <Toast
        type={"error"}
        header={"Error updating status. Please try again."}
        id={"status-update-error"}
      />
      <Toast
        type={"success"}
        header={"Documents updated successfully"}
        id={"documents-updated-success"}
      />
      <Toast
        type={"error"}
        header={"Error updating documents. Please try again."}
        id={"documents-updated-error"}
      />
      <Toast
        type={"error"}
        header={"Please retry after 10 seconds"}
        id={"retry-error"}
      />
      <Toast
        type={"success"}
        header={"Status log saved successfully"}
        id={"status-log-saved"}
      />
      <Toast
        type={"error"}
        header={"Error saving status log. Please try again."}
        id={"status-log-save-failure"}
      />
      <Toast
        type={"error"}
        header={
          "Please upload & save the document uploaded manually on OncoEMR "
        }
        id={"document-uploaded-manually-oncoemr"}
      />
      <Toast
        type={"success"}
        header={"Marked as completed successfully."}
        id={"mark-as-completed-success"}
      />
      <Toast
        type={"error"}
        header={"Error while marking as completed. Please try again."}
        id={"mark-as-completed-error"}
      />
      <Toast
        type={"success"}
        header={"Date of hold until has been recorded successfully"}
        id={"hold-saved-successfully"}
      />
      <Toast
        type={"error"}
        header={"Error while saving hold. Please try again."}
        id={"hold-save-error"}
      />
      <Toast
        type={"error"}
        header={"NAR Grid is not available for this order"}
        id={"nar-grid-not-available"}
      />
      <Toast
        type={"success"}
        header={"RPA Trigger successful"}
        id={"nar-rpa-trigger-success"}
      />
      <Toast
        type={"error"}
        header={"Error in triggering RPA. Please try again."}
        id={"nar-rpa-trigger-error"}
      />
      <Toast
        type={"success"}
        header={"Primary diagnosis code updated successfully!"}
        id={"primary-diagnosis-code-updated-success"}
      />
      <Toast
        type={"error"}
        header={"Error updating primary diagnosis code. Please try again."}
        id={"primary-diagnosis-code-updated-error"}
      />
      <Toast
        type={"error"}
        header={"Please enter a valid Dx Code"}
        id={"dx-code-error"}
      />
      <Toast
        type={"success"}
        header={"Auth Grid fetched successfully!"}
        id={"auth-grid-success"}
      />
      <Toast
        type={"error"}
        header={"Error fetching auth grid. Please try again."}
        id={"auth-grid-failure"}
      />
      <Toast
        type={"error"}
        header={"No data found for the selected criteria."}
        id={"auth-grid-no-data"}
      />
      <Toast
        type={"success"}
        header={"RPA has been Triggered"}
        id={"kill-switch-success"}
      />
      <Toast
        type={"error"}
        header={"Error in triggering RPA. Please try again."}
        id={"kill-switch-failure"}
      />
      <Toast
        type={"error"}
        header={"No orders selected"}
        id={"no-orders-selected"}
      />
      <Toast
        type={"success"}
        header={"PA orders refetched successfully"}
        id={"refetch-pa-order-success"}
      />
      <Toast
        type={"error"}
        header={"Error refetching PA order. Please try again."}
        id={"refetch-pa-order-error"}
      />
      <Toast
        type={"success"}
        header={"PA orders refetched successfully"}
        id={"refetch-pa-order-partial-success"}
      />
      <Toast
        type={"error"}
        header={"Form configuration error"}
        id={"form-configuration-not-available"}
      />
      <Toast
        type={"error"}
        header={"Error getting fax status. Please try again."}
        id={"error-getting-fax-status"}
      />
      <Toast
        type={"error"}
        header={"Fax ID not found"}
        id={"fax-id-not-found"}
      />
      <Toast
        type={"error"}
        header={"No CMM screenshot found for this order"}
        id={"cmm-screenshot-not-found"}
      />
      <Toast
        type={"error"}
        header={"Failed to load CMM screenshot"}
        id={"cmm-screenshot-load-failed"}
      />
      <Toast
        type={"error"}
        header={"Organisation ID not found"}
        id={"organisation-id-not-found"}
      />
      <Toast
        type={"error"}
        header={"Error sending fax. Please try again."}
        id={"error-sending-fax"}
      />
      <Toast
        type={"success"}
        header={"Submission saved successfully!"}
        id={"submission-summary-save-success"}
      />
      <Toast
        type={"error"}
        header={"Error saving submission. Please try again."}
        id={"submission-summary-save-error"}
      />
      <Toast
        type={"success"}
        header={"Files pushed to SFTP successfully!"}
        id={"push-to-sftp-success"}
      />
      <Toast
        type={"error"}
        header={"Error pushing files to SFTP. Please try again."}
        id={"push-to-sftp-failure"}
      />
      <Toast
        type={"error"}
        header={"Please select at least one file to push to SFTP"}
        id={"push-to-sftp-no-selection"}
      />
      <Toast
        type={"success"}
        header={
          "Re-run in progress! Please wait while we process your request."
        }
        id={"re-run-in-progress"}
      />
      <Toast
        type={"error"}
        header={"Error in re-running the workflow. Please try again."}
        id={"re-run-error"}
      />
      <Toast
        type={"success"}
        header={"Prescription report successful!"}
        id={"prescription-report-success"}
      />
      <Toast
        type={"error"}
        header={"Error in reporting prescription. Please try again."}
        id={"prescription-report-error"}
      />
    </>
  );
};

export default Toasts;
