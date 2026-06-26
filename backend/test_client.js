import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testSubmit() {
  try {
    // Create a dummy image
    const dummyPath = path.join(process.cwd(), 'dummy.jpg');
    fs.writeFileSync(dummyPath, Buffer.from('dummy image content'));

    const form = new FormData();
    form.append('image', fs.createReadStream(dummyPath));
    form.append('latitude', '30.7333');
    form.append('longitude', '76.7794');

    console.log("Sending request to localhost:5000...");
    const response = await axios.post('http://localhost:5000/api/issues/report', form, {
      headers: form.getHeaders()
    });

    console.log("SUCCESS:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("SERVER ERROR:", error.response.data);
    } else {
      console.error("REQUEST ERROR:", error.message);
    }
  }
}

testSubmit();
