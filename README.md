# Issue Tracker

The Issue Tracker is a Web Application that tracks issues in a project. Once installed, you can:

- 📄 **Create and manage projects**, which act as a container for issues.
- 🐞 **Create and track issues**, including tasks, comments, and attachments, within a project.
- ✌️ **Invite others** to collaborate on your project by adding them as members.
- 🔔 **Use Activity Feed** to stay up-to-date on the status of your project and issues. (Current)
- 🔔 **Use Notifications and alerts** to stay up-to-date on the status of your project. (Coming Soon)
- 📊 **Use labels, milestones, and other metadata** to organize and categorize issues. (Coming Soon)
- 🔒 **Use permissions and access controls** to manage who can view and edit issues within a project. (Coming Soon)
- 🔒 **Use security controls**, such as two-factor authentication and data encryption, to protect your data and secure access to your projects. (Coming Soon)
- 💬 **Collaborate with others in real-time** through built-in chat and communication features. (Coming Soon)
- 📈 **Use reports and charts** to track the progress of your project. (Coming Soon)
- 📈 **Use integration with other tools**, such as project management or code repository platforms, to streamline your workflow. (Coming Soon)
- 📈 **Use dashboards** to track the progress of your project and current open issues. (Coming Soon)
- 💾 **Use version control** to track changes to issues and restore previous versions if needed. (Coming Soon)

## Gallery

- ### Projects

  Projects are **containers for issues**. You can create a project to **track issues** related to a specific product, feature, or initiative.

  ## ![projects](https://user-images.githubusercontent.com/66995301/210263373-586b7129-cc57-4e14-ab23-3cb1c075d539.png)

- ### Project Overview

  Project Overview page **displays a summary of the project**, including the project name, description, members, and issues.

  ## ![project-overview](https://user-images.githubusercontent.com/66995301/210263448-f1da0996-1f29-4205-a624-4e1a075a3c28.png)

- ### Project Issues

  Project Issues page **displays a list of all the issues** in the project.

  ## ![project-issues](https://user-images.githubusercontent.com/66995301/210263540-61148820-7a0b-4e16-ab50-47ddaf407d31.png)

- ### Project Members

  Project Members page **displays a list of all the members** in the project.

  ## ![project-members](https://user-images.githubusercontent.com/66995301/210263828-214b65fe-fa26-4861-92fb-a60ef1fc6c9c.png)

- ### Project Settings

  Project Settings **helps to edit the project details.**

  ## ![project-settings](https://user-images.githubusercontent.com/66995301/210263959-28504096-033b-4962-92a5-83e181d4696f.png)

- ### Issues

  Issues page **displays a list of all the issues.**

  ## ![issues](https://user-images.githubusercontent.com/66995301/210264094-3c87d96e-fd07-443f-b688-2323d85e7f6f.png)

- ### Issue Overview

  Issue Overview page **displays a summary of the issue**, including the issue name, description, assignee, and tasks.

  ## ![issue-overview](https://user-images.githubusercontent.com/66995301/210264686-1977a557-fd40-473e-86f1-7146217b44df.png)

- ### Issue Comments

  Comments page **displays a list of all the comments in the issue.**

  ## ![issue-comments](https://user-images.githubusercontent.com/66995301/210266695-558720b4-80d6-4231-8be0-20eac992ad98.png)

- ### Issue Attachments

  Attachments page displays a **list of all the attachments in the issue.**

  ## ![issue-attachments](https://user-images.githubusercontent.com/66995301/210265036-e1ef1af8-ae33-42d3-9046-cb1ce97f68dd.png)

- ### Issue Tasks

  Tasks page **displays a list of all the tasks in the issue.**

  ## ![issue-tasks](https://user-images.githubusercontent.com/66995301/210264829-85d731df-ebca-4110-8bf2-cd376570e84e.png)

## Installation

1. **Download and install Node.js and npm:**

   - Go to https://nodejs.org and download LTS version.
   - Run the installer and follow the prompts to install Node.js and npm.
   - Check the installation by running `node --version` and `npm --version` in a command prompt.

2. **Download and install PostgreSQL:**

   - Go to https://www.postgresql.org/download and download the installer.
   - Follow the prompts to install PostgreSQL on your system.
   - Check the installation by running `psql --version` in a command prompt.

3. **Connect to PostgreSQL and run the schema SQL file:**

   - Open a command prompt and connect to PostgreSQL using the following command:
     `psql -U postgres`
   - Enter your password when prompted.
   - Copy the contents of `/server/src/configs/db.schema.sql` and paste them in the psql console, then press enter to execute the SQL commands.
   - To view all the tables that were created, type `\d` in the psql console.

4. **Download and install Git:**

   - Go to the Git website (https://git-scm.com/downloads) and download the installer:
   - Check the installation status of git by running `git --version` in cmd.

5. **Clone the git repo and install dependencies:**

   - Clone the git repo using `git clone https://github.com/sourabh-singh-rawat/pine.git`
   - Install backend dependencies by going to `/server` and using `npm install`
   - Install frontend dependencies going to `/client` and using `npm install`

6. **Install firebase services for authentication and storage:**

   - Sign up for Firebase and go to the console to create a new project.

   - Authentication

     - In the Firebase console, go to the Authentication section and click on "Get started". Enable Google as a sign-in provider, add a support email, and save the changes.

   - Storage

     - In the Firebase console, go to the Storage section and click on "Get started". Choose "Test mode" and click "Next". Click "Done" to finish the setup.

   - In the Firebase console, go to the project settings and register a web app by clicking on the `</>` icon
   - Go to the `/client` directory in your project and install Firebase if it's not already installed using `npm i firebase`
   - In the Firebase console, copy the `firebaseConfig` variables shown to the `firebaseConfig` variable in the `/client/src/configs/firebase.configs.js` file in your project.
     ```
      // Config will looks like this
      apiKey: "AIzaSyBg39iZrsuY-pCz-Oj4ZLa9enPvPurDwUQ",
      authDomain: "test-d2028.firebaseapp.com",
      projectId: "test-d2028",
      storageBucket: "test-d2028.appspot.com",
      messagingSenderId: "45944513713",
      appId: "1:45944513713:web:a7b8bb1438f8147cdb2e90"
     ```

7. **Setup firebase authentication for the backend server:**

   - Go to the project settings in the Firebase console and click on the service accounts tab.
   - Click on the "Generate new private key" button to download the private key file. Save the file as `service-account.json` in the `/config` directory in the root. Make sure to keep the file safe, as it contains a private key.
     ```
       # Firebase Configuration
       GOOGLE_APPLICATION_CREDENTIALS_PATH={PATH TO YOUR FIREBASE SERVICE ACCOUNT KEY}
     ```

8. **Integrate Sendgrid email service for the backend server:**

   - Sign up for a SendGrid account at https://sendgrid.com.
   - Go to the Email API section in the sidebar, and click on the "Integration Guide" button.
   - Choose "Web API" and click on "Node.js" to view the instructions for integrating SendGrid with a Node.js backend.
   - Follow the instructions to create an API key by typing a name and clicking on "Create Key".
   - Copy the value of the API key and add it to the environment variable `SENDGRID_API_KEY` in the `/config/.env` file.
     ```
       # Sendgrid Configuration
       SENDGRID_API_KEY=[YOUR SEND GRID API KEY]
     ```

9. **Create an `.env` file in the `/config` and add the following variables if not already:**

   ```
     # Database Configuration
     DB_NAME=issue-tracker
     DB_HOST=localhost
     DB_USER={YOUR POSTGRES USERNAME}
     DB_PASSWORD={YOUR POSTGRES PASSWORD}
     DB_POST=5432

     # Firebase Configuration
     STORAGE_BUCKET={YOUR FIREBASE STORAGE BUCKET NAME}
     GOOGLE_APPLICATION_CREDENTIALS_PATH={PATH TO YOUR FIREBASE SERVICE ACCOUNT KEY}

     # Sendgrid Configuration
     SENDGRID_API_KEY=[YOUR SEND GRID API KEY]
   ```

## Usage

- Go to `/server` and type `npm start` to start the backend server.
- Go to `/client` and type `npm start` to start the frontend server.
