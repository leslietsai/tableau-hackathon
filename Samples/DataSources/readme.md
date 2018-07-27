# Tableau Speech Commands Extension
Authors:
Leila Mardoum, Akiva Notkin, Jeemin Sim, Saugat Tripathi, Leslie Tsai

This project used the [Mozilla Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) and the Tableau Extensions API to create a small extension which can 
run a few simple commands by speaking. Primarily, these commands had to do with filters because they were the most visually obvious changes to a workbook which had commands in the Extensions API.

Notes: 
 - As you might be able to tell we did not change many of the file names. This was built on top of the original DataSource Extension example but uses only some of the same code
 - We had some trouble with microphone access (only one of the laptops we used worked) but theoretically if everything was on https it would work fine

[Link to workbook which contains the Extension](https://qa-20182l/#/views/hackathontest/Dashboard4?:iid=4)
