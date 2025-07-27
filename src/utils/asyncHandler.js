//ye ek helper file hai which catches error automatically

const asyncHandler = (requestHandler) => {
    return (req,res,next) => {  // yaha bug aaya tha humne return hee nhi kara tha method ko
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}

export { asyncHandler }



/*
const asyncHandler = () => {}  //A basic arrow function with no parameters and an empty body.
const asyncHandler = (func) => () => {}  //This is a higher-order function — a function that returns another function.
const asyncHandler = (func) => async () => {}  //This is a real-world async wrapper function, often used in Express.js
*/


// const asyncHandler = (fn) => async (req,res,next) => {
//     try{
//         await fn(req,res,next)

//     } catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message: err.message
//         })
//     }
// }