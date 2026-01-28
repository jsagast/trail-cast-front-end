
<h1 style="text-align: center;">TRAIL CAST APP</h1>

### 🔖 Description
---
***TRAIL CAST APP*** is a web application that allows users to track weather forecasts for specific outdoor locations and organize them into custom lists. Users can save locations, monitor forecast conditions, and keep a log of their activities.

The app also encourages community interaction by allowing users to comment on shared lists and engage with other users. Trail Cast makes it easy to plan outdoor activities, stay informed about changing conditions, and connect with fellow outdoor enthusiasts.

### 📸 Screenshots 
---

| Description       | Screenshot |
| :----------------:| :------:   |
| <h3 align="center">Landing Page</h3>     |   <img src="public/images/landing.jpg" width="600">   |
| <h3 align="center">Sign Up </h3>   | <img src="public/images/signup.jpg" width="600"> |
| <h3 align="center">Sign In </h3>   | <img src="public/images/signin.jpg" width="600"> |
| <h3 align="center">Home Page</h3>      |   <img src="public/images/homepage.jpg" width="600">   |
| <h3 align="center">My Profile</h3>       |  <img src="public/images/myprofile.jpg" width="600">   |
| <h3 align="center">View List </h3>    |  <img src="public/images/viewlist.jpg" width="600">   |
| <h3 align="center">View Location</h3>   | <img src="public/images/viewlocation.jpg" width="600"> |


### ⛰️ Getting started (USER) 
---
### App Flow

1. **Sign Up / Sign In**  
   Create an account or log in to get started.

2. **Profile Access**  
   After logging in, the app uploads 5-day weather data for random locations.

3. **Search for Places**  
   The search bar allows you to explore weather data for specific locations and add as many locations as you want to a personalized list.

4. **My Profile**  
   Your profile gives you access to the lists you have created. You can edit or delete any list you own, and you can also create new lists from here.

5. **View List**  
   When accessing your lists, you can view weather data for the locations you have added, leave comments on the list, and explore individual locations.

6. **View Location**  
   When accessing a specific location, you can log, edit, or delete activities you have completed at that location.

### 👨‍💻 Getting started (PROGRAMMER) 

1. Fork and clone this repository to your local machine.

2. After moving into the cloned directory, run `npm i` to download the dependencies.

3. Create a `.env` file in the root of the project and add the following:

    **Back End**
- MONGODB_URI=mongodb+srv://___username:password___@sei-w0kys.azure.mongodb.net/___projectname___?retryWrites=true.
- JWT_SECRET (can generate a random running  ___"node -e "console.log(require('crypto').randomBytes(256).toString('base64'))"___ in your terminal).
- API_KEY (go to [Geopify](https://myprojects.geoapify.com/login) to generate your own key).

    **Front End**

```plaintext
VITE_BACK_END_SERVER_URL=http://localhost:3000
```

4. Start the app with `npm run dev`.


### :computer: Technologies Used
---

  ![MongoDB](https://img.shields.io/badge/-MongoDB-05122A?style=flat&logo=mongodb)
  ![Express](https://img.shields.io/badge/-Express-05122A?style=flat&logo=express)
  ![Node](https://img.shields.io/badge/-Node.js-05122A?style=flat&logo=node.js)
  ![JavaScript](https://img.shields.io/badge/-JavaScript-05122A?style=flat&logo=javascript)
  ![CSS3](https://img.shields.io/badge/-CSS-05122A?style=flat&logo=css3)
  ![Trello](https://img.shields.io/badge/-Trello-05122A?style=flat&logo=trello)
  ![Heroku](https://img.shields.io/badge/-Heroku-05122A?style=flat&logo=heroku)
  ![Markdown](https://img.shields.io/badge/-Markdown-05122A?style=flat&logo=markdown)
  ![Git](https://img.shields.io/badge/-Git-05122A?style=flat&logo=git)
  ![Github](https://img.shields.io/badge/-GitHub-05122A?style=flat&logo=github)
  ![VSCode](https://img.shields.io/badge/-VS_Code-05122A?style=flat&logo=visualstudio)
  ![React](https://img.shields.io/badge/-React-05122A?style=flat&logo=react)
  ![JWT](https://img.shields.io/badge/-JSON_Web_Tokens-05122A?style=flat&logo=jsonwebtokens)
  ![Netlify](https://img.shields.io/badge/-Netlify-05122A?style=flat&logo=netlify)

### ⏭️ Future Enhancements 
---
- Scale the app for mobile availability.
- Integrate historical data (seasonal, monthly, etc.).

##### Resources
---
- [w3school](https://www.w3schools.com/)
- [MDN](https://developer.mozilla.org/en-US/)
- [Regex](https://regexr.com)


### Let's use the App
---
Check out the following link [XXX](https:)

:rocket::boom: