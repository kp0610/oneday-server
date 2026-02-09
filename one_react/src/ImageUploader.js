import React, { useRef } from 'react'; // Import useRef

const ImageUploader = ({ onImageUpload, children }) => { // Accept children prop
    const fileInputRef = useRef(null); // Create a ref for the file input

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // reader.result contains the Data URL
                onImageUpload(file, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current.click(); // Trigger the hidden file input click
    };

    return (
        <>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef} // Assign the ref
                style={{ display: 'none' }} // Hide the input
            />
            <div onClick={handleClick}> {/* Render children and attach click handler */}
                {children}
            </div>
        </>
    );
};

export default ImageUploader;
