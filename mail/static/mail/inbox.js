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
      load_mailbox('sent');
    })
    .catch(error => {
      console.log('Error: ', error)
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show the mails
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Print emails
      console.log(emails);

      // Do something else with emails.
      emails.forEach(email => {
        let newdiv = document.createElement('div');
        newdiv.data = `${email.id}`;
        newdiv.style.display = 'flex';
        // newdiv.innerHTML = `<b>Subject: ${email.subject} | Sender: ${email.sender} | ${email.timestamp}</b>
        // <br> 
        // ${email.body}`;
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
        document.querySelector('#emails-view').append(newdiv) 
        
        newdiv.onmouseover = () => newdiv.style.cursor = 'pointer';
        newdiv.onclick = () => load_mail(`${email.id}`, `${mailbox}`);
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
    // document.querySelector('#single-email-view').innerHTML = `
    // from: ${email.sender}
    // <br> to: ${email.recipients}
    // <br> date: ${email.timestamp}
    // <br> subject: ${email.subject}
    // <hr>
    // ${email.body} `;
    document.querySelector('#senderField').innerHTML = `${email.sender}`;
    document.querySelector('#receiversField').innerHTML = `${email.recipients}`;
    document.querySelector('#dateField').innerHTML = `${email.timestamp}`;
    document.querySelector('#subjectField').innerHTML = `${email.subject}`;
    document.querySelector('#emailBody').innerHTML = `${email.body}`;
    toggle_read(email.id, true);
    if(mailbox !== 'sent') {
      const buttonRow = document.createElement('div');
      buttonRow.className = 'buttonRow';
      document.querySelector('#single-email-view').append(buttonRow);
      let readStatusButton = document.createElement('button');
      let archiveStatusButton = document.createElement('button');
      let replyButton = document.createElement('button');
      readStatusButton.className = 'btn btn-primary';
      readStatusButton.innerHTML = 'Mark Unread';
      archiveStatusButton.className = 'btn btn-primary';
      if(mailbox === 'inbox') {
        archiveStatusButton.innerHTML = 'Archive';
      }
      else {
        archiveStatusButton.innerHTML = 'Unarchive';
      }
      replyButton.className = 'btn btn-primary';
      replyButton.innerHTML = 'Reply';
      buttonRow.append(readStatusButton);
      buttonRow.append(archiveStatusButton); 
      buttonRow.append(replyButton);
      readStatusButton.addEventListener('click', () => { 
        toggle_read(email.id, false);
      });
      if(!email.archived) {
        archiveStatusButton.addEventListener('click', () => toggle_archive(email.id, true));
        archiveStatusButton.innerHTML = 'Archive';
      }
      else {
        archiveStatusButton.addEventListener('click', () => toggle_archive(email.id, false));
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
  document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: \n\n\t${email.body} \n \n`;

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
      load_mailbox('sent');
    })
    .catch(error => {
      console.log('Error: ', error)
    });
    return false;
  }
}