import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`
});
//console.table(cloudinary.config());

const cloudinaryUpload = async (localFilePath) => {

    try {
        if(!localFilePath){
            return null
        }
        const response = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "auto",
            }
        )
        //console.log("File uploaded successfully", response.url);
        fs.unlinkSync(localFilePath);
        return response;        
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove from local server if upload failed
        console.error("Cloudinary error", error);
        
        return null;
    }
}

const cloudinaryDelete = async (filePublicUrl) => {
    try {
        await cloudinary.uploader.destroy(filePublicUrl);
    } catch (error) {
        console.error("Cloudinary delete error", error);
        return null;
    }
}

export {
    cloudinaryUpload,
    cloudinaryDelete
};