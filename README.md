# nwen406-p3

An AWS lambda application for rendering 3D ray traced images in a 
parallel fashion.

Lambda function is lambda_render.py. An API endpoint must be set up to 
receive broswer requests. Index.html and the associated scripts/css need 
tobe hosted (locally is fine). The lambda endpoint is set atop 
putimage.js under LAMBDA_ENDPOINT.


Intending to change how jobs are submitted to allow more concurrent 
requests/faster rendering.
