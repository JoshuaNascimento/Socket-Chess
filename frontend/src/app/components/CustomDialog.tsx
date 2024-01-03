import Button from '@mui/material/Button';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

/**
 * 
 * @param {open}: Boolean value determining if the dialog should be rendered or not
 * @param {children}: Prop to get the component's children which are rendered in the dialog content
 * @param {title}: Title of the dialog
 * @param {contentText}: Message to be displayed in the dialog
 * @param {handleContinue}: Function to be called when the 'continue' button is clicked
 * @returns 
 */
export default function CustomDialog({ open, children, title, contentText, handleContinue }: any) {
  {/* */}
  return (
    <Dialog open={open}>  {/* Dialog Container */}
  
      <DialogTitle>{title}</DialogTitle>
      <DialogContent> {/* Main Body of modal/dialog */}
        <DialogContentText> {/* Main Text */}
          {contentText}
        </DialogContentText>
        {children}  {/* Other Content */}
      </DialogContent>

      <DialogActions> {/* Dialog Action Presses */}
        {/* Force users to make input without option to cancel */}
        {/* <Button onClick={handleClose}>Cancel</Button> */}
        <Button onClick={handleContinue}>Continue</Button>
      </DialogActions>
      

    </Dialog>
  )
}