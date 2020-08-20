document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // If submit button has been clicked
  document.querySelector('#compose-form').onsubmit = () => {
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    const recipients = document.querySelector('#compose-recipients').value;
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body : body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      document.querySelector('#message').style.display = 'block';
      if(result.message) {
        document.querySelector('#message').className = 'alert text-center alert-success';
        document.querySelector('#message').innerHTML = result.message;
      }
      else {
        document.querySelector('#message').className = 'alert text-center alert-danger';
        document.querySelector('#message').innerHTML = result.error;
      }
      // Change the page to 'Sent' after an email has been sent
      if(result.message === 'Email sent successfully.')
        load_mailbox('sent');
      document.querySelector('#message').style.display = 'block';
    })
    .catch(error => {
      console.log('Error: ', error);
    });
    // Do not refresh the page and go to the default route on submitting
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#message').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show the mails
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      if(emails.length === 0) 
        document.querySelector('#emails-view').append('There are no emails to view at the moment.');
      // Print emails
      console.log(emails);
      // Variable 'unread' will keep track of the unread emails
      let unread = 0;
      // Do something else with emails.
      emails.forEach(email => {
        //Increment unread emails
        if(!email.read)
          unread++;
        // Create the div that will contain each individual email in the list displayed in the mailbox
        let newdiv = document.createElement('div');
        newdiv.data = `${email.id}`;
        newdiv.style.display = 'flex';
        if(email.read) {
          newdiv.style.backgroundColor = '#eee';
          newdiv.innerHTML = `
          <div style="display : inline-flex; align-self : center; margin-right: 20px; font-size: 22px"> 
          <i class="far fa-envelope-open"></i> </div>
          <div style=""> <b>${email.subject}</b>
          <br>
          From: ${email.sender} - ${email.timestamp}
          </div>
          `;
        }
        else {
          newdiv.innerHTML = `
          <div style="display : inline-flex; align-self : center; margin-right: 20px; font-size: 22px"> 
          <i class="far fa-envelope "></i> </div>
          <div style=""> <b>${email.subject}</b>
          <br>
          From: ${email.sender} - ${email.timestamp}
          </div>
          `;
        }
        newdiv.style.border = '1px solid lightgrey';
        newdiv.style.padding = '10px 20px';
        newdiv.style.marginBottom = '15px'; 
        // Append each email to the main inbox div
        document.querySelector('#emails-view').append(newdiv) 
        
        // Manually add a cursor style to the div, since it's not a button
        newdiv.onmouseover = () => newdiv.style.cursor = 'pointer';
        newdiv.onclick = () => load_mail(`${email.id}`, `${mailbox}`);
        if(mailbox === 'inbox')
          document.querySelector(`#${mailbox}`).innerHTML = `Inbox <b>${unread}</b>`;
      });

    })
    .catch(error => {
      console.log('Error: ', error)
    });
  
}

function load_mail(id, mailbox) {

  // Show the selected email and hide other views
  document.querySelector('#single-email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show contents of the mail
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //Fill the fields of the HTML template created
    document.querySelector('#senderField').innerHTML = `${email.sender}`;
    document.querySelector('#receiversField').innerHTML = `${email.recipients}`;
    document.querySelector('#dateField').innerHTML = `${email.timestamp}`;
    document.querySelector('#subjectField').innerHTML = `${email.subject}`;
    document.querySelector('#emailBody').innerHTML = `${email.body}`;

    // Mark the email as read, when it is opened
    toggle_read(email.id, true);

    // Display the additional button row at the bottom only for inbox and archived mails.
    if(mailbox !== 'sent') {
      const buttonRow = document.querySelector('.buttonRow');
      buttonRow.innerHTML = `
      <button class="btn btn-primary" id="read">Mark Unread</buttton>
      <button class="btn btn-primary" id="archive">Archive</button>
      <button class="btn btn-primary" id="reply">Reply</button>
      `;
      let readStatusButton = document.querySelector('#read');
      let archiveStatusButton = document.querySelector('#archive');
      let replyButton = document.querySelector('#reply');
      if(mailbox === 'inbox') {
        archiveStatusButton.innerHTML = 'Archive';
      }
      else {
        archiveStatusButton.innerHTML = 'Unarchive';
      }
      readStatusButton.addEventListener('click', () => { 
        toggle_read(email.id, false);;
      });
      if(!email.archived) {
        archiveStatusButton.addEventListener('click', () => {
          toggle_archive(email.id, true);
        });
        archiveStatusButton.innerHTML = 'Archive';
      }
      else {
        archiveStatusButton.addEventListener('click', () => {
          toggle_archive(email.id, false);
        });
        archiveStatusButton.innerHTML = 'Unarchive';
      }
      replyButton.addEventListener('click', () => {
        reply(email);
      });
    }
  })
  .catch(error => console.log(error));
}

function toggle_read(id, bool) {
  // Use the PUT API
  fetch(`/emails/${id}`, {
    method : 'PUT',
    body : JSON.stringify( {
      read : bool
    })
  })
  .then(() => {
    if(!bool)
      // Change the page to 'Inbox' after marking an email as unread
      load_mailbox('inbox')
  });
}

function toggle_archive(id, bool) {
  // Use the PUT API
  fetch(`/emails/${id}`, {
    method : 'PUT',
    body : JSON.stringify( {
      archived : bool
    })
  })
  // Change the page to 'Inbox' after marking the email as unread
  .then(() => load_mailbox('inbox'));
}

function reply(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Fill composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  if(email.subject.trim().substring(0,3) !== 'Re:') {
  document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  else {
    document.querySelector('#compose-subject').value = `${email.subject}`;
  }
  document.querySelector('#compose-body').value = `\tOn ${email.timestamp}, ${email.sender} wrote: \n\t  ${email.body} \n \n`;

  // If submit button has been clicked
  document.querySelector('#compose-form').onsubmit = () => {
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    const recipients = document.querySelector('#compose-recipients').value;
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body : body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      document.querySelector('#message').style.display = 'block';
      if(result.message) {
        document.querySelector('#message').className = 'alert text-center alert-success';
        document.querySelector('#message').innerHTML = result.message;
      }
      else {
        document.querySelector('#message').className = 'alert text-center alert-danger';
        document.querySelector('#message').innerHTML = result.error;
      }
      // Change the page to 'Sent' after an email has been sent
      if(result.message === 'Email sent successfully.')
        load_mailbox('sent');
      document.querySelector('#message').style.display = 'block';
    })
    .catch(error => {
      console.log('Error: ', error);
    });
    // Do not refresh the page and go to the default route on submitting
    return false;
  }
}