
//A function to help us debug
function message(text) {
    const debughelp = document.getElementById("debughelp");
    const child = document.createElement("p");
    child.textContent = text;
    debughelp.appendChild(child);
}


/*
The functions below will help us process an image from a canvas to output a 2-dimensional color grid that we will use later. 
*/

//This is our color pallet. Note that we have "muddied" the colors to be a little less bright, which will help us better match colors in pictures that may not have pure bright colors. Later we make this pallet in the Lab color scheme so we only have to calculate it once. 
const basicPalletAdj = [
    [0, 0, 0,0],//clear
    [30,150,30,255], //green
    [15, 82, 186,255], //blue
    [255,150,0,255], //orange
    [230, 221, 30,255], //yellow
    [60,60,60,255], //black
    [240,30,30,255], //red
    [255,255,255,255],//white
    [130, 0, 250,255],//purple
    [90, 30, 250,255],//blue-violet
    [255, 190, 200, 255],//pink
    [92, 64, 51,255],//brown
    [181, 131, 29,255], //light brown
    [170,220,90,255], //yellow-green
    [255,90,60,255], //red-orange
    [173, 216, 230, 255],//lightblue
    [30,150,160,255], //blue-green
    [220, 220, 220,255],//gray
    [180, 240, 190,255]//light green
]
const basicPalletNames = [
    "Clear", 
    "Green",
    "Blue", 
    "Orange", 
    "Yellow", 
    "Black",
    "Red",
    "White", 
    "Purple", 
    "Blue-Violet", 
    "Pink", 
    "Brown", 
    "Light Brown", 
    "Yellow-Green",
    "Red-Orange",
    "Light Blue",
    "Blue-Green",
    "Gray",
    "Light Green"
]

//Will return the distance squared from point1 to point2 and -1 if the two points have different lengths. 
function distanceSq(point1, point2) {
    if (point1.length!=point2.length) {
        return -1
    }
    let sumDiffSq = 0;
    for (let i=0; i<point1.length; i++) {
        sumDiffSq += (point1[i]-point2[i])**2;
    }
    return sumDiffSq
}

//Will take a list [r, g, b, a] to a string that will specify the color. 
function listToRGB(L) {
    let c = "rgb(";
    c = c+L[0]+",";
    c = c+L[1]+",";
    c = c+L[2]+",";
    c = c+L[3]+")";
    return c
}


//Methods to convert rgb to lab

//This is a small piece-wise function
function smallhelper(x) {
    if (x>.008856) {
        return Math.cbrt(x)
    } else {
        return (903.3*x+16)/116
    }
}

//The input is given as [r,b,g,a] (we ignore the a) and the output will be [L,a,b]
function rgbToLab(rgbColor) {
    const r = rgbColor[0];
    const g = rgbColor[1];
    const b = rgbColor[2];
    const x = smallhelper((.4124*r+.3576*g+.1805*b)/95.05);
    const y = smallhelper((.2126*r+.7152*g+.0722*b)/100);
    const z = smallhelper((.0193*r+.1192*g+.9505*b)/108.88);
    return [116*y-16, 500*(x-y), 200*(y-z)]
}


const basicPalletLab = basicPalletAdj.map(rgbToLab);



//Find the closest color via a conversion to Lab (this is a particular was to view colors just like RGB). We return the color as a list. 
function closestColorLab(pxl, pallet, palletLab) {
    if (pallet.length==0) {
        return -1
    }
    let i = 0;
    const labPxl = rgbToLab(pxl);
    let dist = distanceSq(labPxl, palletLab[0]);
    for (let j=1; j<pallet.length; j++) {
        const currentDist = distanceSq(labPxl, palletLab[j]);
        if (currentDist<dist) {
            i = j
            dist = currentDist
        }
    }
    return pallet[i]
}


//Given some colorData in [red, green, blue, alpha], we find the closest color in our pallet for each pixel and return the mode of this list. 
function modeColor(colorList) {
    const colorDictionary = {};
    for (const color of colorList) {
        let closestColor = [];
        if (color[3]<10) {
            //i.e. we have an opac color
            closestColor = [0,0,0,0];
        } else {
            closestColor = closestColorLab(color, basicPalletAdj, basicPalletLab);
        }
        const colorString = closestColor.join(",");
        
        if (colorString in colorDictionary) {
            colorDictionary[colorString] += 1;
        } else {
            colorDictionary[colorString] = 1;
        }
    }
    let mostColor = "";
    let highestCount = 0;
    for (const colorOptions in colorDictionary) {
        if (colorDictionary[colorOptions]>highestCount) {
            mostColor = colorOptions;
            highestCount = colorDictionary[colorOptions];
        }
    }
    return mostColor.split(",");  
}


//This function will take colorData, which is a list of [r,b,g,a] coming from a picture. We include width and height of this picture since this will not be evident from colorData. We essentially divide this picture into a grid, where each box of this grid is "resolution" number of pixels wide and high. Since this may not be perfectly centered, we adjust our grid so that it is as centered as possible, in essence ignoring the border of our origional picture. Within  each box of our grid, we find the "best" color from our pallet that represents these pixels. We return a list of colors form our pallet. 
function processColorData(colorData, resolution, widthPixels, heightPixels) {
    //The method needs to be first determined. Average or Mode. 
    const method = 0;//colorChoiceMethod(colorData);//0 will mean we use the mode method, we will do this for now until we test how our functions are working. 
    const res = resolution;
    const width = widthPixels;
    const height = heightPixels;
    const newColorData = [];
    const newWidth = Math.floor(width/resolution);
    const newHeight = Math.floor(height/resolution);
    const wAdj = Math.floor((width%res)/2);
    const hAdj = Math.floor((height%res)/2);
    
    for (let a=0; a<newHeight; a++) {
        for (let b=0; b<newWidth; b++) {
            const colorList = [];
            //Here we process our square
            for (let i=0; i<resolution; i++) {
                for (let j=0; j<resolution; j++) {
                    const x = (a*res+i+hAdj)*width + (b*res+j+wAdj);
                    colorList.push(colorData[x]);
                };
            };
            
            let choiceColor = [];
            if (method == 0) {
                choiceColor = modeColor(colorList);
            } else {
                choiceColor = averageColor(colorList);
            }
            newColorData.push(closestColorLab(choiceColor, basicPalletAdj, basicPalletLab));
        };
    };

    
    return newColorData;
}

//Sometimes the picture we get have a clear background (alpha = 0). We take a moment to replace clear with the first unused color in our pallet, so that our background is distinct. 
function replaceClear(processedColors) {
    //We are going to spend one more moment to replace "clear" with an actual color
    const colorsUsed = new Set();
    for (const color of processedColors) {
        colorsUsed.add(color.join(","));
    }
    let clearIndex = 0;
    if (basicPalletAdj.length>colorsUsed.size) {
        clearIndex++;
        while((basicPalletAdj[clearIndex].join(",") in colorsUsed)) {
            clearIndex++;
        }
    }
    if (clearIndex==0) {
        return 0
    }
    const [r,g,b,a] = basicPalletAdj[clearIndex];

    for (const color of processedColors) {
        if (color[3]<10) {
            color[0] = r;
            color[1] = g;
            color[2] = b;
            color[3] = a;
        }
    }
    basicPalletAdj[0] = [0,0,0,0];
    return 1
}


//When we get our image data from our picture we have a very long list of integers in the form of red, green, blue, alpha, red, green, blue, alpha, ... We parse this into a list of 4-tuples of the form [red, green, blue, alpha]. 
function processedImageData(colorData, resolution, picwidth, picheight) {
    const pixels = colorData;
    
    const colors = [];
    for (let i=0; i<pixels.length; i+=4) {
        const red = pixels[i];
        const blue = pixels[i+1];
        const green = pixels[i+2];
        const alpha = pixels[i+3];
        colors.push([red, blue, green, alpha]);
    }
    
    const processedPixels = processColorData(colors, resolution, picwidth, picheight);
    
    replaceClear(processedPixels);
    return processedPixels
}


/*
Below are the series of functions that will place certain pictures in certain canvas or construct canvas and pictures based off of an image file. 
*/


//A function to place a picture file into a specific canvas. 
function placePicture(imageName, canvas) {
    //const canvas = document.getElementById(canvasID);
    //canvas.height = 1.3*canvas.width;
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        const image =  new Image();
        image.addEventListener("load", () => {
            const picwidth = image.width;
            const picheight = image.height;
            //const ratio = canvas.width/picwidth;
            canvas.width = picwidth;
            canvas.height = picheight;
            ctx.drawImage(image, 0, 0,canvas.width,canvas.height);
        });
        image.src = imageName;
    }
}


//This function will draw the grid
//sidePixels = number of pixels for each square in the grid
//widthSquares = number of squares accross for our grid
//heightSquares = number of squares in height for our grid
//thickness = thickness of the gridded lines
//xAdjust and yAdjust essentially say where the upper left hand corner of our grid starts. These will generally be chosen so our picture is centered in the canvas. 
function drawGrid(context, sidePixels, thickness, widthSquares, heightSquares, xAdjust, yAdjust) {
    //draw the grid
    const picWidth = sidePixels*widthSquares;
    const picHeight = sidePixels*heightSquares;
    context.lineWidth = thickness;
    context.fillStyle = "black";
    for (let i=0; i<widthSquares+1; i++) {
        context.beginPath();
        context.moveTo(i*sidePixels+xAdjust, yAdjust);
        context.lineTo(i*sidePixels+xAdjust, picHeight+yAdjust);
        context.stroke();
        context.closePath();
    };
    
    for (let i=0; i<heightSquares+1; i++) {
        context.beginPath();
        context.moveTo(xAdjust,i*sidePixels+yAdjust);
        context.lineTo(picWidth+xAdjust, i*sidePixels+yAdjust);
        context.stroke();
        context.closePath();
    };
}

//Here we draw the colored squares for our grid, esentially to get a preview of what we made. 
//widthSquares is how many squares in width for our grid. 
//sidePixels is how many pixels each square is on its side
//xAdjust and yAdjust essentially say where the upper left hand corner of our grid starts. These will generally be chosen so our picture is centered in the canvas. 
//context is the context of the canvas we are drawing on. 
function drawColors(context, processedColors, sidePixels, widthSquares, xAdjust, yAdjust) {
    let i = 0;//the row
    let j = 0;//the column
    for (const pxl of processedColors) {
        const c = listToRGB(pxl);
        context.fillStyle = c;
        context.fillRect(i*sidePixels+xAdjust,j*sidePixels+yAdjust,sidePixels,sidePixels);
        if (i<widthSquares-1) {
            i++;
        } else {
            i = 0;
            j++;
        }
    }
}



//Here we draw the numbers associated to the colors in the grid. 
//widthSquares is how many squares in width for our grid. 
//sidePixels is how many pixels each square is on its side
//xAdjust and yAdjust essentially say where the upper left hand corner of our grid starts. These will generally be chosen so our picture is centered in the canvas. 
//ctx is the context of the canvas we are drawing on. 
function drawNumbers(ctx, processedColors, sidePixels, widthSquares, xAdjust, yAdjust) {
    let palletIndicies = {};//elements of form {indexOfPallet: colorInKey}
    const basicPalletStr = [];
    let number = 1;
    for (const color of basicPalletAdj) {
        basicPalletStr.push(color.join(","));
    }
    let row = 0;
    let col = 0;
    const xCenter = Math.floor(sidePixels/2);
    const yCenter = Math.ceil(sidePixels/2);
    const textHeight = Math.floor(2*sidePixels/3);
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';
    ctx.fillStyle = "black";
    ctx.font = textHeight+"px serif";
    for (const color of processedColors) {
        const colorStr = color.join(",");
        const index = basicPalletStr.indexOf(colorStr);
        if (!(index in palletIndicies)) {
            palletIndicies[index]=number;
            number++;
        }
        //Now let us draw the number
        const x = xAdjust+row*sidePixels+xCenter;
        const y = yAdjust+col*sidePixels+yCenter;
        ctx.fillText(palletIndicies[index], x, y);
        if (row<widthSquares-1) {
            row++;
        } else {
            row = 0;
            col++;
        }
    }
    return palletIndicies
}

//Here we draw the key to tell our artists what numbers are associated to what colors. We do not fill these with colors.
//ctx is the context of the canvas we are drawing on, 
//palletIndicies is a dictonary of the form {indexFromPallet: numberWePlaceOnGrid}
//heightSquares is the number of boxes our grid is tall
//widthSquares is the number of boxes our grid is wide
//sidePixls is the number of pixels each square is in the grid
//xAdjust and yAdjust essentially say where the upper left hand corner of our grid starts. These will generally be chosen so our picture is centered in the canvas. 
function drawKey(ctx, palletIndicies, difficulty, heightSquares, widthSquares, sidePixels, xAdjust, yAdjust) {
    //Based on difficulty we will set a few features like number of columns when displaying the color key
    let m = 0;
    let boxedge = 0;
    if (difficulty=="easy") {
        m = 3;
        boxedge = 4;
    } else if (difficulty=="medium") {
        m = 4;
        boxedge = 3;
    } else {
        m = 5;
        boxedge = 2;
    }


    ctx.textBaseline = 'middle';
    ctx.fillStyle = "black";
    const boxSize = Math.floor(widthSquares*sidePixels/(6*m));
    const toCenterBoxAdjh = Math.ceil(boxSize/2);
    const toCenterBoxAdjv = Math.ceil(boxSize/2);
    ctx.font = Math.floor(2*boxSize/3)+"px serif";
    let row = 0;
    let col = 0;
    //const vertDist = Math.floor(boxSize*1.5);
    const vertSpacer = 10;
    //const widthFraction = Math.floor(widthSquares*sidePixels/18);
    for (const index in palletIndicies) {
        const x = xAdjust+(6*row+1)*boxSize;
        const y = yAdjust+heightSquares*sidePixels+col*boxSize+(col+1)*vertSpacer;
        ctx.fillRect(x,y,boxSize,boxSize);
        ctx.clearRect(x+boxedge,y+boxedge,boxSize-2*boxedge,boxSize-2*boxedge);
        ctx.textAlign = "center";
        ctx.font = Math.floor(2*boxSize/3)+"px serif";
        ctx.fillText(palletIndicies[index], x+toCenterBoxAdjh, y+toCenterBoxAdjv);
        ctx.textAlign = "left";
        
        ctx.fillText(basicPalletNames[index], x+boxSize+5, y+toCenterBoxAdjh, boxSize*3);

        if (row==m-1) {
            row = 0;
            col++;
        } else {
            row++;
        }
    }
}

//A function to resize the canvas into a fraction of the width of its parent element. 
function resizeCanvas(canvas, percentParent) {
    //To reset the size of the canvas, store the image as a new image, reset the width and height, and then reinput the image with that new width and height. 
    //get the image
    const width = canvas.width;
    const height = canvas.height;
    const storedImageData = canvas.toDataURL();
    const img = new Image();
    img.src = storedImageData;
    
    //reset the size of the canvas
    const parentWidth = canvas.parentElement.clientWidth;
    const newWidth = parentWidth*percentParent;
    const newHeight = newWidth*height/width;
    canvas.width = newWidth;
    canvas.height = newHeight;

    //draw the image back in
    img.onload = function() {
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0,newWidth,newHeight);
    }
}

//Draw the colored preview
function drawColoredPreview(processedColors, canvas, thickness, sidePixels, widthSquares, heightSquares, xAdjust, yAdjust) {
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        drawColors(ctx, processedColors, sidePixels, widthSquares, xAdjust, yAdjust);
        drawGrid(ctx, sidePixels, thickness, widthSquares, heightSquares, xAdjust, yAdjust);
        //Eventually we will need to draw the key?
        
    }
}

//Draw the un-colored preview, essentially where we have numbers to represent the colors. We draw the key as well. 
function drawUncoloredPreview(processedColors, difficulty, canvas, thickness, sidePixels, widthSquares, heightSquares, xAdjust, yAdjust) {
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        const palletIndicies = drawNumbers(ctx, processedColors, sidePixels, widthSquares, xAdjust, yAdjust);
        
        drawGrid(ctx, sidePixels, thickness, widthSquares, heightSquares, xAdjust, yAdjust);
        drawKey(ctx, palletIndicies, difficulty, heightSquares,widthSquares, sidePixels, xAdjust, yAdjust);
    }
}


//Return the number of unique elements in a list of lists. 
function numberUnique(L) {
    const collection = new Set();
    for (const elem of L) {
        collection.add(elem.join(""));
    }
    return collection.size
}


//Given the difficulty we will calculate and determine several things. This includes how thick the lines of our grid should be, how wide each square our grid should be, how many squares wide and tall our grid will be, xAdjust/yAdjust to help us center our drawings later
function difficultyCalculations(difficulty, picwidth, picheight, standardizedWidth, standardizedHeight) {
    //We do our calculation off of the larger dimension. 
    const lgDim = Math.max(picwidth, picheight);
    const lgStandDim = Math.max(standardizedWidth, standardizedHeight);
    let resolution = 0;
    let thickness = 0;
    let standardSidePixels = 0
    if (difficulty == "easy" ) {
        resolution = Math.floor(lgDim/16);
        thickness = 4;
    } else if (difficulty == "medium" ){
        resolution = Math.floor(lgDim/22);
        thickness = 2;
    } else {
        resolution = Math.floor(lgDim/35);
        thickness = 1;
    }
    standardSidePixels = Math.floor(resolution*lgStandDim/lgDim);
    const widthSquares = Math.floor(picwidth/resolution);
    const heightSquares = Math.floor(picheight/resolution);
    const xAdjust = Math.floor((standardizedWidth-(standardSidePixels*widthSquares))/2);
    const yAdjust = xAdjust;
    return [thickness, resolution, standardSidePixels, widthSquares, heightSquares, xAdjust, yAdjust]
}

//Given an image we already have, we place the preview and a download button for users to use to color. 
function drawExample(imageName, parentID, difficulty) {
    //First let us just draw the image in the canvas
    //we will adjust the size of our canvases last. 
    const parent = document.getElementById(parentID);

    const container = document.createElement("div");
    parent.appendChild(container);
    const areaWidth = container.clientWidth;

    const canvasOrigional = document.createElement("canvas");
    container.appendChild(canvasOrigional);
    
    if (canvasOrigional.getContext) {
        const image = new Image();
        //We must make sure we have loaded the image first before this, otherwise we won't be able to access dimensions, ect of the image.  
        image.addEventListener("load", () => {
            //preprocess the data
            const ctx = canvasOrigional.getContext("2d");
            const picwidth = image.width;
            const picheight = image.height;
            canvasOrigional.width = picwidth;
            canvasOrigional.height = picheight;
            
            //We draw the image in the canvas that will contain the colored version, extract the data. 
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, picwidth, picheight);
            const pixels = imageData.data;
            
            drawColoredAndUncolored(container, pixels, picwidth, picheight, difficulty);
            //Now let us resize the origional picture
            resizeCanvas(canvasOrigional, .3);
        })
        image.src = imageName;
    }
}

//This function will draw the colored and uncolored version of our mosaic in the specified "container" from the raw picture data give the specified "difficulty". We must specify the picture width and height since this is not appaent from the image data. 
function drawColoredAndUncolored(container, imagePixelData, picwidth, picheight, difficulty) {
    //const areaWidth = container.clientWidth;

    //First we make the cavases for the colored and uncolored versions
    const canvasColored = document.createElement("canvas");
    container.appendChild(canvasColored);
    const canvasUncolored = document.createElement("canvas");
    container.appendChild(canvasUncolored);

    //Make the button that will download the contents of the uncolored version. 
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Download";
    container.appendChild(downloadButton);

    
    
    
    
    //Get information we need calculated from difficulty and on how big we want the canvas. We will set the final result to a certain percentage of the webpage's width. For now we will have the colored and uncolored the same. 
    //RESET HERE AS NEEDED TO RESIZE.  
    const finalWidthPixels = 800;
    const finalHeightPixels = Math.ceil(finalWidthPixels*picheight/picwidth);

    const [thickness, sidePixels, standardSidePixels, widthSquares, heightSquares, xAdjust, yAdjust] = difficultyCalculations(difficulty, picwidth, picheight, finalWidthPixels, finalHeightPixels);

    //Process our pixels
    const processedColors = processedImageData(imagePixelData, sidePixels, picwidth, picheight);

    //Reset the sizes of our canvases accordingly. 
    const numberOfColors = numberUnique(processedColors);
    
    canvasUncolored.width = finalWidthPixels;
    canvasUncolored.height = finalHeightPixels+Math.floor(finalWidthPixels/15)*(Math.ceil(numberOfColors/3)+1);
    canvasColored.width = finalWidthPixels;
    canvasColored.height = finalHeightPixels;

    //Some calculations and variables to help us fit our image nicely into a pdf. 
    let sides = 15;
    let pdfWidth = 180;
    let pdfHeight = 180;
    const finalHeightOverWidthRatio = canvasUncolored.height/canvasUncolored.width;
    if (277/180 > finalHeightOverWidthRatio) {
        pdfHeight = 277;
        pdfWidth = pdfHeight/finalHeightOverWidthRatio;
        sides = (210-pdfWidth)/2;
    } else {
        pdfHeight = pdfWidth*finalHeightOverWidthRatio;
    }

    //DRAWING THE COLORED VERSION
    drawColoredPreview(processedColors, canvasColored,thickness, standardSidePixels, widthSquares, heightSquares, xAdjust, yAdjust);
    //DRAWING THE NUMBERED VERSION
    drawUncoloredPreview(processedColors, difficulty, canvasUncolored,thickness, standardSidePixels, widthSquares, heightSquares, xAdjust, yAdjust);

    //Get the information from the uncolored version
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    // Convert canvas to image data
    const imgData = canvasUncolored.toDataURL('image/png');

    //set up the botton to listen for the click
    downloadButton.addEventListener('click', function() {
        // Add the canvas image to the PDF
        //Standard paper is Width: 210 mm, Height: 297 mm
        pdf.addImage(imgData, 'PNG', sides, 10, pdfWidth, pdfHeight);
        pdf.save('canvas.pdf'); // Download the PDF
    });

    //Reset the sizes of the canvses if needed, we needed to form a pdf from a larger version before shrinking. 
    resizeCanvas(canvasColored, .3);
    resizeCanvas(canvasUncolored, .3);
    
}

/*
Here we place the code for the user upload. 
*/


//This method will take the user information (the image uploaded and the difficulty chosen) create a colored and uncolred preview as well as a download button where the user can download a nice version of the final product. 
function MakeAndProcessUserImage() {
    //clear the alert message box incase there was something present and the div area we place pictures. 
    const alertMessageBox = document.getElementById("alertMessages");
    const parent = document.getElementById("userImages");
    alertMessageBox.textContent = "";
    parent.innerHTML = '';

    //make an alert if a file wasn't chosen. 
    const fileInput = document.getElementById("userImage");
    if (fileInput.files.length === 0) {
        //Add a message that the file was missing. 
        alertMessageBox.textContent = "Please upload a file.";
        return 0
    }


    //Make a canvas that we use to extract the image data
    const container = document.createElement("div");
    parent.appendChild(container);
    const canvasOrigional = document.createElement("canvas");
    container.appendChild(canvasOrigional);
    
    //Now place in the image. For now the canvas will be made the same size as the image. 
    const uploadedFile = fileInput.files[0];
    const difficultyChoice = document.getElementById("difficulty").value;
    const ctxOrg = canvasOrigional.getContext('2d');
    if (uploadedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                //Here is the code to place the image
                const picwidth = img.width;
                const picheight = img.height;
                canvasOrigional.width = picwidth;
                canvasOrigional.height = picheight;
                ctxOrg.drawImage(img, 0, 0);
                //Extract the image data and store as pixels
                const imageData = ctxOrg.getImageData(0, 0, img.width, img.height);
                const pixels = imageData.data;
                //Reset dimensions of canvasOrigional to be a reasonable size for the page
                //Make colored and uncolored preview with optional download button. 
                drawColoredAndUncolored(container, pixels, picwidth, picheight, difficultyChoice);
                //Now let us resize the origional picture
                resizeCanvas(canvasOrigional, .3);
                
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(uploadedFile);
    }
}



/*
Below we will include code that places items onto our website and make the buttons work. 
*/


//The button that users use to upload the image. 

window.onload = function() {
    const buttonUserUpload = document.getElementById("buttonProcessor");
    buttonUserUpload.addEventListener("click", MakeAndProcessUserImage);
    //message("You did it!");

    //easy examples
    drawExample("dog2.png", "easyExamples", "easy");
    drawExample("butterfly.png", "easyExamples", "easy");
    drawExample("shark.png", "easyExamples", "easy");

    //medium examples
    drawExample("dog.png", "mediumExamples", "medium");
    drawExample("dinoStego.png", "mediumExamples", "medium");
    drawExample("dinoTrex.png", "mediumExamples", "medium");
    drawExample("train4.png", "mediumExamples", "medium");

    //hard examples
    drawExample("cat.png", "hardExamples", "hard");
    drawExample("sun2.jpeg", "hardExamples", "hard");
}