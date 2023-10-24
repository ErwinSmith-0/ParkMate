import authModel from "../../DB/Model/authModel.js";
import { joseJwtDecrypt } from "../../Utils/AccessTokenManagement/Tokens.js";
import CustomError from "../../Utils/ResponseHandler/CustomError.js";

export const AuthMiddleware = async (req, res, next) => {
  console.log('asdasdsad');
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];
  if (!AuthHeader) {
    return next(CustomError.unauthorized('auth header not found'));
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized('checking checking'));
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized('checking checking'));
    }

    const UserToken = await joseJwtDecrypt(token);
    console.log(UserToken, 'user token');
    
    const UserDetail = await authModel
      .findOne({ _id: UserToken.payload.uid })
      // .populate("image");

    if (!UserDetail) {
      return next(CustomError.unauthorized('checking checking'));
    }
    UserDetail.tokenType = UserToken.payload.tokenType;
    req.user = UserDetail;
    return next();
  } catch (error) {
    // return next(CustomError.unauthorized('checking checking'));
    return next(CustomError.createError(error.message, 400))
  }
};


export const EphemeralAccessMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];
  if (!AuthHeader) {
    return next(CustomError.unauthorized(AuthHeader));
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized(parts));
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized());
    }

    const UserToken = await joseJwtDecrypt(token);
  
    if (!UserToken) {
      return next(CustomError.unauthorized("UserToken"));
    }
   
    req.user = UserToken;
    return next();
  } catch (error) {
    return next(CustomError.createError(error.message, 400))
  }
};

// export const AdminMiddleware = async (req, res, next) => {
//   const AuthHeader =
//     req.headers.authorization ||
//     req.body.token ||
//     req.query.token ||
//     req.headers["x-access-token"];
    
//   if (!AuthHeader) {
//     return next(CustomError.unauthorized());
//   }
//   const parts = AuthHeader.split(" ");
//   try {
//     if (parts.length !== 2) {
//       return next(CustomError.unauthorized());
//     }

//     const [scheme, token] = parts;
//     // token

//     if (!/^Bearer$/i.test(scheme)) {
//       return next(CustomError.unauthorized());
//     }

//     const UserToken = await joseJwtDecrypt(token);

//     const UserDetail = await authModel
//       .findOne({ _id: UserToken.payload.uid })
//       .populate("image");

//     if (!UserDetail && UserDetail.userType == "admin") {
//       return next(CustomError.unauthorized());
//     }


//     req.user = UserDetail;
//     return next();
//   } catch (error) {
//     console.log(error)
//     return next(CustomError.unauthorized());
//   }
// };
