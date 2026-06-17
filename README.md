# Optimizing Input in Generative AI Powered Public Redesign
This is a 2025/2026 (CS-IT9/10) thesis project by students at Aalborg University.
Created by: Cody Jackson, Farika M.M. Farook, and Ma Shalah
**You can find the PDF of our full report in this repository.**

AI Image editing powered by Black Forest Lab's **FLUX.2 (klien 9B)** and **FLUX.1 Fill (pro)** models.

## Web-app Hosting
This project was originally hosted using [Vercel](https://vercel.com). The AI editing functionality will not work on localhost. You must also apply your Black Forest Labs API key in the environment variables as "BFL_API_KEY".

## VM Backend
This project operates with a backend hosted via an Ubuntu VM and **pm2**. Follow these steps to setup the backend server.

1. Start running an ubuntu VM which can operate continuously. It must be publicly visible on a specific port (we used port 5000).
2. Create a `project` folder, and inside that a `data-api` folder.
3. Place the provided `server.js` folder inside the `data-api` folder. Ensure to go inside the script and replace our vercel.app URL with yours.
4. Create a `data` folder, and inside that create three folders; `post-study-responses`, `prompt-history`, and `users`. This is where your data will be stored.
5. Install `npm`, `express`, `fs`, `path`, and `pm2`.
6. Navigate to the `data-api` folder and input the following commands:
```
pm2 start server.js --name YOUR_NAME-data-api
```
then
```
pm2 save
```
followed by
```
pm2 startup
```
Make sure to copy and submit the command `pm2 startup` prints out for you so the server will keep going on reboot.
### Status Checking
The server should now be up and running. You can check its health by running the following commands inside the Ubuntu VM:
```
curl -i http://127.0.0.1:5000/health
curl -i http://127.0.0.1:5000/api/users
```
You can test the health outside the VM in your own separate terminal with:
```
curl -i http://your_vercel_app_url/api/users
curl -i http://your_vercel_app_url/api/prompt-history
curl -i http://your_vercel_app_url/api/post-study-responses
```
