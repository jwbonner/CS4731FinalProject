# CS4731FinalProject
## Table Food Scene
Our project is a simple scene consisting of a table, fork, glass, plate, and
food within a house. The plate slides to the center of the table and the fork
lifts up and picks up some food.

### Topics:
1. There are several complex 3D models achieved by importing .OBJ files (fork, plate, table, glass).
2. There are several model transformations for animation. The plate slides across the table, the fork lifts, and the food lifts.
3. There is a point light illuminating the scene using Phong shading.
4. There is a spotlight pointing at the front of the table.
5. The table is textured and has a default texture.
6. The camera can be controlled using the arrow keys.
7. There is a hierarchical model consisting of the plate as a grandparent, the food as a parent and the one piece of lifted food as a child.
8. There is clearly a projection shadow from the fork.
9. The fork is reflective.
10. The glass is refractive.
11. There is a textured skybox showing the interior of a room.
12. Keyboard controls:
    1. Space - Toggle animation on and off
    2. S - Toggle shadows on and off
    3. L - Toggle diffuse/specular of point light
    4. C - Toggle camera animation
    5. Arrow Keys - Control the camera if camera animation is disabled
    6. R - Restart animation

### Challenges:
We ran into several challenges when implementing this project. 

When importing OBJ files, values represented using scientific notation were 
not parsing properly causing seemingly random points to stick out of the models. 
We fixed this by adding additional parsing functionality.

When implementing the skybox there were issues with having multiple different
textures and having multiple different faces in the texture. We fixed this by
using a separate texture with a boolean to detect which texture should be used
and loading 6 different images with detection for when they all loaded.

Responsibilities:
Jonah - Rendering models, Point lighting, Spotlight, Textures, Shadows, Reflection, Refraction
Matt - Finding models, Arranging scene, Animation, Keyboard controls, Camera movement, Skybox, Readme
